import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import Pedido from '../models/Pedido.js';
import CategoriaItem from '../models/CategoriaItem.js';
import Variante from '../models/Variante.js';
import Cupom from '../models/Cupom.js';
import { autenticar, somenteAdmin } from '../middleware/auth.js';
import { promoverProximo, entrarNaFila, getLimiteFila, setLimiteFila } from '../services/fila.js';
import { salvarImagem } from '../services/upload.js';
import { notificarClienteOrcamento, notificarClienteConcluido } from '../services/email.js';
import { postarNoTicket } from '../services/discord.js';

const router = Router();

// Tudo aqui exige admin.
router.use(autenticar, somenteAdmin);

// ---- Configurações gerais (editáveis por qualquer admin) ----
// GET /api/admin/config — lê as configs (hoje: limite da fila).
router.get('/config', async (req, res) => {
  try {
    res.json({ filaLimite: await getLimiteFila() });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao ler configurações', detalhe: err.message });
  }
});

// PUT /api/admin/config — atualiza o limite da fila (mínimo 1).
router.put('/config', async (req, res) => {
  try {
    const n = Number(req.body.filaLimite);
    if (!Number.isFinite(n) || n < 1) {
      return res.status(400).json({ erro: 'O limite precisa ser um número inteiro maior ou igual a 1.' });
    }
    res.json({ filaLimite: await setLimiteFila(n) });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar configurações', detalhe: err.message });
  }
});

// ---- Upload de imagens (Cloudinary se configurado, senão disco em /uploads) ----
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(), // buffer em memória; o destino é decidido no service
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Envie uma imagem (png, jpg, webp ou gif)'));
  },
});

// POST /api/admin/upload — recebe um arquivo "imagem" e devolve a URL pública
router.post('/upload', (req, res) => {
  upload.single('imagem')(req, res, async (err) => {
    if (err) return res.status(400).json({ erro: err.message });
    if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    try {
      const url = await salvarImagem(req.file, uploadsDir);
      res.status(201).json({ url });
    } catch (e) {
      res.status(500).json({ erro: 'Falha ao salvar imagem', detalhe: e.message });
    }
  });
});

function popularPedido(query) {
  return query
    .populate('cliente', 'nome email')
    .populate('versoes.itens.variante')
    .populate('itensAvulsos.variante');
}

// Soma os valores aprovados pelo admin para sugerir/validar o total.
function calcularTotal(pedido) {
  let total = 0;
  for (const v of pedido.versoes || []) {
    if (typeof v.valorAprovado === 'number') {
      total += v.valorAprovado;
    } else {
      for (const it of v.itens || []) {
        total += (it.valorAprovado || 0) * (it.quantidade || 1);
      }
    }
  }
  for (const it of pedido.itensAvulsos || []) {
    total += (it.valorAprovado || 0) * (it.quantidade || 1);
  }
  for (const ip of pedido.itensPersonalizados || []) {
    total += ip.valor || 0;
  }
  return total;
}

// ===================== PEDIDOS =====================

// GET /api/admin/pedidos?status=pendente_aprovacao (aceita vários: ?status=a,b)
router.get('/pedidos', async (req, res) => {
  try {
    const filtro = {};
    if (req.query.status) {
      const lista = String(req.query.status).split(',').map((s) => s.trim()).filter(Boolean);
      filtro.status = lista.length > 1 ? { $in: lista } : lista[0];
    }
    const pedidos = await popularPedido(Pedido.find(filtro).sort({ createdAt: -1 }));
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pedidos', detalhe: err.message });
  }
});

// PUT /api/admin/pedidos/:id/orcar — admin define valores e envia o orçamento ao cliente
router.put('/pedidos/:id/orcar', async (req, res) => {
  try {
    const { versoes, itensAvulsos, itensPersonalizados, valorTotal, observacaoAdmin } = req.body;
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (!['pendente_aprovacao', 'orcado'].includes(pedido.status)) {
      return res.status(400).json({ erro: 'Este pedido não pode ser orçado no status atual' });
    }

    // Aplica os valores por posição, preservando as referências de variante.
    (versoes || []).forEach((v, i) => {
      if (!pedido.versoes[i]) return;
      if (v.valorAprovado != null) pedido.versoes[i].valorAprovado = Number(v.valorAprovado);
      (v.itens || []).forEach((it, j) => {
        if (pedido.versoes[i].itens[j] && it.valorAprovado != null) {
          pedido.versoes[i].itens[j].valorAprovado = Number(it.valorAprovado);
        }
      });
    });
    (itensAvulsos || []).forEach((it, i) => {
      if (pedido.itensAvulsos[i] && it.valorAprovado != null) {
        pedido.itensAvulsos[i].valorAprovado = Number(it.valorAprovado);
      }
    });
    (itensPersonalizados || []).forEach((ip, i) => {
      if (pedido.itensPersonalizados[i] && ip.valor != null) {
        pedido.itensPersonalizados[i].valor = Number(ip.valor);
      }
    });

    pedido.valorTotal = valorTotal != null ? Number(valorTotal) : calcularTotal(pedido);
    if (observacaoAdmin != null) pedido.observacaoAdmin = observacaoAdmin;
    pedido.status = 'orcado';

    await pedido.save();
    notificarClienteOrcamento(pedido); // avisa o cliente que o orçamento saiu
    res.json(await popularPedido(Pedido.findById(pedido._id)));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao orçar pedido', detalhe: err.message });
  }
});

// PUT /api/admin/pedidos/:id/itens — admin edita os itens do pedido (antes do pagamento).
// Como os itens mudam, o pedido volta para "pendente_aprovacao" (precisa reorçar).
router.put('/pedidos/:id/itens', async (req, res) => {
  try {
    const { versoes, itensAvulsos, itensPersonalizados } = req.body;
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (!['pendente_aprovacao', 'orcado'].includes(pedido.status)) {
      return res.status(400).json({ erro: 'Só é possível editar os itens antes do pagamento' });
    }

    const sanItem = (it) => ({
      variante: it.variante?._id || it.variante,
      quantidade: Math.max(1, Number(it.quantidade) || 1),
      observacao: it.observacao?.trim() || undefined,
      valorAprovado: it.valorAprovado != null ? Number(it.valorAprovado) : undefined,
    });

    if (pedido.tipo === 'model') {
      pedido.versoes = (versoes || [])
        .map((v) => ({
          nome: v.nome?.trim() || 'Personagem',
          itens: (v.itens || []).map(sanItem),
          valorAprovado: v.valorAprovado != null ? Number(v.valorAprovado) : undefined,
        }))
        .filter((v) => v.itens.length > 0);
    } else {
      pedido.itensAvulsos = (itensAvulsos || []).map(sanItem);
    }

    pedido.itensPersonalizados = (itensPersonalizados || [])
      .filter((ip) => ip.descricao?.trim())
      .map((ip) => ({
        tipo: ip.tipo || 'Item Específico',
        descricao: ip.descricao.trim(),
        valor: ip.valor != null && ip.valor !== '' ? Number(ip.valor) : undefined,
      }));

    // itens mudaram → o orçamento antigo não vale mais
    pedido.status = 'pendente_aprovacao';
    pedido.valorTotal = undefined;

    await pedido.save();
    res.json(await popularPedido(Pedido.findById(pedido._id)));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao editar itens', detalhe: err.message });
  }
});

// PUT /api/admin/pedidos/:id/confirmar-pagamento — artista confirma que o Pix caiu →
// o pedido entra na fila de produção.
router.put('/pedidos/:id/confirmar-pagamento', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (pedido.status !== 'aguardando_pagamento') {
      return res.status(400).json({ erro: 'Este pedido não está aguardando confirmação de pagamento' });
    }

    await entrarNaFila(pedido); // fila_producao (pode promover direto a em_producao)

    const atual = await Pedido.findById(pedido._id).select('status posicaoFila');
    if (atual.status === 'fila_producao') {
      const naFrente = await Pedido.countDocuments({
        status: { $in: ['fila_producao', 'em_producao'] },
        posicaoFila: { $lt: atual.posicaoFila },
      });
      postarNoTicket(pedido, `✅ **Pagamento confirmado!** Seu pedido entrou na fila de produção — posição ${naFrente + 1}.`);
    } else {
      postarNoTicket(pedido, '✅ **Pagamento confirmado!** Seu pedido já entrou em produção. 🛠️');
    }

    res.json(await popularPedido(Pedido.findById(pedido._id)));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao confirmar pagamento', detalhe: err.message });
  }
});

// PUT /api/admin/pedidos/:id/concluir — conclui o pedido e promove o próximo da fila.
router.put('/pedidos/:id/concluir', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (pedido.status !== 'em_producao') {
      return res.status(400).json({ erro: 'Só é possível concluir um pedido em produção' });
    }

    pedido.status = 'concluido';
    await pedido.save();
    notificarClienteConcluido(pedido);
    postarNoTicket(pedido, '🎉 **Seu pedido foi concluído!** O artista vai combinar a entrega por aqui.');

    const promovido = await promoverProximo(); // próximo da fila entra em produção
    res.json({
      pedido: await popularPedido(Pedido.findById(pedido._id)),
      promovido: promovido ? promovido._id : null,
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao concluir pedido', detalhe: err.message });
  }
});

// ===================== CATÁLOGO =====================

// GET /api/admin/catalogo — catálogo completo (inclui variantes inativas), p/ gestão
router.get('/catalogo', async (req, res) => {
  try {
    const categorias = await CategoriaItem.find().sort({ tipo: 1, ordem: 1, nome: 1 }).lean();
    const variantes = await Variante.find().sort({ nome: 1 }).lean();

    const porCategoria = new Map();
    for (const v of variantes) {
      const chave = String(v.categoria);
      if (!porCategoria.has(chave)) porCategoria.set(chave, []);
      porCategoria.get(chave).push(v);
    }

    const catalogo = categorias.map((c) => ({
      ...c,
      variantes: porCategoria.get(String(c._id)) || [],
    }));
    res.json(catalogo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar catálogo', detalhe: err.message });
  }
});

// POST /api/admin/categorias
router.post('/categorias', async (req, res) => {
  try {
    const categoria = await CategoriaItem.create(req.body);
    res.status(201).json(categoria);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao criar categoria', detalhe: err.message });
  }
});

// PUT /api/admin/categorias/:id
router.put('/categorias/:id', async (req, res) => {
  try {
    const categoria = await CategoriaItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada' });
    res.json(categoria);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao atualizar categoria', detalhe: err.message });
  }
});

// POST /api/admin/variantes
router.post('/variantes', async (req, res) => {
  try {
    const variante = await Variante.create(req.body);
    res.status(201).json(variante);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao criar variante', detalhe: err.message });
  }
});

// PUT /api/admin/variantes/:id
router.put('/variantes/:id', async (req, res) => {
  try {
    const variante = await Variante.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!variante) return res.status(404).json({ erro: 'Variante não encontrada' });
    res.json(variante);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao atualizar variante', detalhe: err.message });
  }
});

// DELETE /api/admin/variantes/:id — desativa (soft delete)
router.delete('/variantes/:id', async (req, res) => {
  try {
    const variante = await Variante.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );
    if (!variante) return res.status(404).json({ erro: 'Variante não encontrada' });
    res.json({ ok: true, variante });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao desativar variante', detalhe: err.message });
  }
});

// ===================== CUPONS =====================

// GET /api/admin/cupons
router.get('/cupons', async (req, res) => {
  try {
    res.json(await Cupom.find().sort({ createdAt: -1 }).lean());
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar cupons', detalhe: err.message });
  }
});

// POST /api/admin/cupons
router.post('/cupons', async (req, res) => {
  try {
    const { codigo, tipo, valor, descricao, usosPorUsuario, ativo } = req.body;
    const cupom = await Cupom.create({
      codigo: (codigo || '').trim().toUpperCase(),
      tipo: tipo === 'fixo' ? 'fixo' : 'percentual',
      valor: Number(valor) || 0,
      descricao,
      usosPorUsuario: Math.max(0, Number(usosPorUsuario) || 0),
      ativo: ativo !== false,
    });
    res.status(201).json(cupom);
  } catch (err) {
    const msg = err.code === 11000 ? 'Já existe um cupom com esse código' : err.message;
    res.status(400).json({ erro: 'Erro ao criar cupom', detalhe: msg });
  }
});

// PUT /api/admin/cupons/:id
router.put('/cupons/:id', async (req, res) => {
  try {
    const dados = { ...req.body };
    if (dados.codigo) dados.codigo = dados.codigo.trim().toUpperCase();
    if (dados.valor != null) dados.valor = Number(dados.valor) || 0;
    if (dados.usosPorUsuario != null) dados.usosPorUsuario = Math.max(0, Number(dados.usosPorUsuario) || 0);
    const cupom = await Cupom.findByIdAndUpdate(req.params.id, dados, { new: true });
    if (!cupom) return res.status(404).json({ erro: 'Cupom não encontrado' });
    res.json(cupom);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao atualizar cupom', detalhe: err.message });
  }
});

// DELETE /api/admin/cupons/:id
router.delete('/cupons/:id', async (req, res) => {
  try {
    const r = await Cupom.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ erro: 'Cupom não encontrado' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao excluir cupom', detalhe: err.message });
  }
});

export default router;
