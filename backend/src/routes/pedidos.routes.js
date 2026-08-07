import { Router } from 'express';
import Pedido from '../models/Pedido.js';
import User from '../models/User.js';
import Cupom from '../models/Cupom.js';
import Counter from '../models/Counter.js';
import { autenticar } from '../middleware/auth.js';
import {
  notificarClientePedidoCriado,
  notificarArtistaNovoPedido,
  notificarArtistaCancelamento,
  notificarArtistaPedidoAceito,
} from '../services/email.js';
import { abrirTicket } from '../services/discord.js';
import { contarFila, getLimiteFila } from '../services/fila.js';

// Status em que o cliente ainda pode cancelar o pedido (antes de aceitar/produzir).
const CANCELAVEIS = ['pendente_aprovacao', 'orcado'];

const router = Router();

// Popula os nomes/preços das variantes em todo lugar que elas aparecem.
function popularPedido(query) {
  return query
    .populate('cliente', 'nome email discordId')
    .populate('versoes.itens.variante')
    .populate('itensAvulsos.variante');
}

// Limpa o que vem do cliente: ele NUNCA define valores (isso é do admin).
function sanitizarItem(item) {
  return {
    variante: item.variante,
    quantidade: Math.max(1, Number(item.quantidade) || 1),
    observacao: item.observacao?.trim() || undefined,
    cor: item.cor?.trim() || undefined, // cor escolhida (ex: pets)
    descricoes: Array.isArray(item.descricoes)
      ? item.descricoes.map((d) => (d || '').trim())
      : undefined, // ex: expressões, um texto por unidade
  };
}

// POST /api/pedidos — cliente cria um novo pedido
router.post('/', autenticar, async (req, res) => {
  try {
    const { tipo, versoes, itensAvulsos, itensPersonalizados, aceiteTermo, discordUsuario } = req.body;

    if (!['model', 'item_avulso'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo de pedido inválido' });
    }
    if (!aceiteTermo?.aceito) {
      return res.status(400).json({ erro: 'É necessário aceitar o termo para enviar o pedido' });
    }

    // Fila cheia? Bloqueia novos pedidos até abrir vaga.
    const limiteFila = await getLimiteFila();
    if ((await contarFila()) >= limiteFila) {
      return res.status(409).json({
        erro: `A fila de produção está cheia (${limiteFila} pedidos ao mesmo tempo). Aguarde abrir uma vaga para enviar um novo pedido.`,
      });
    }

    const dados = {
      cliente: req.usuario.id,
      tipo,
      aceiteTermo: { aceito: true, dataAceite: new Date() },
      status: 'pendente_aprovacao',
      discordUsuario: discordUsuario?.trim() || undefined,
      itensPersonalizados: (itensPersonalizados || [])
        .filter((i) => i.descricao?.trim())
        .map((i) => ({ tipo: i.tipo, descricao: i.descricao.trim() })),
    };

    if (tipo === 'model') {
      dados.versoes = (versoes || [])
        .map((v) => ({
          nome: v.nome?.trim() || 'Personagem',
          itens: (v.itens || []).map(sanitizarItem),
        }))
        .filter((v) => v.itens.length > 0);
    } else {
      dados.itensAvulsos = (itensAvulsos || []).map(sanitizarItem);
    }

    const temConteudo =
      (dados.versoes?.some((v) => v.itens.length) ?? false) ||
      (dados.itensAvulsos?.length ?? 0) > 0 ||
      dados.itensPersonalizados.length > 0;

    if (!temConteudo) {
      return res.status(400).json({ erro: 'O pedido precisa ter pelo menos um item' });
    }

    dados.numero = await Counter.proximo('pedido'); // número sequencial (#42)
    const pedido = await Pedido.create(dados);
    const completo = await popularPedido(Pedido.findById(pedido._id));

    // notificações (fire-and-forget)
    notificarClientePedidoCriado(completo);
    notificarArtistaNovoPedido(completo, req.usuario.nome);

    res.status(201).json(completo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar pedido', detalhe: err.message });
  }
});

// GET /api/pedidos/meus — pedidos do cliente logado
router.get('/meus', autenticar, async (req, res) => {
  try {
    const pedidos = await popularPedido(
      Pedido.find({ cliente: req.usuario.id }).sort({ createdAt: -1 })
    );
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pedidos', detalhe: err.message });
  }
});

// GET /api/pedidos/:id — detalhe de um pedido (dono ou admin)
router.get('/:id', autenticar, async (req, res) => {
  try {
    const pedido = await popularPedido(Pedido.findById(req.params.id));
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });

    const ehDono = String(pedido.cliente._id) === req.usuario.id;
    if (!ehDono && req.usuario.role !== 'admin') {
      return res.status(403).json({ erro: 'Sem permissão para ver este pedido' });
    }
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pedido', detalhe: err.message });
  }
});

// PUT /api/pedidos/:id/aceitar — cliente aceita o orçamento → abre o ticket no Discord
// e fica AGUARDANDO PAGAMENTO (cliente paga a entrada + envia comprovante; artista confirma).
router.put('/:id/aceitar', autenticar, async (req, res) => {
  try {
    const pedido = await popularPedido(Pedido.findById(req.params.id));
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (String(pedido.cliente._id) !== req.usuario.id) {
      return res.status(403).json({ erro: 'Sem permissão' });
    }
    if (pedido.status !== 'orcado') {
      return res.status(400).json({ erro: 'O pedido não está aguardando aceite' });
    }

    if (req.body.discordUsuario?.trim()) pedido.discordUsuario = req.body.discordUsuario.trim();

    // abre o ticket no Discord com o orçamento + forma de pagamento
    const ticket = await abrirTicket(pedido);
    if (ticket) {
      pedido.discordCanalId = ticket.canalId;
      pedido.discordCanalUrl = ticket.canalUrl;
    }
    pedido.status = 'aguardando_pagamento';
    await pedido.save();

    notificarArtistaPedidoAceito(pedido); // e-mail ao artista pra conferir o pagamento

    res.json(await popularPedido(Pedido.findById(pedido._id)));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao aceitar orçamento', detalhe: err.message });
  }
});

// PUT /api/pedidos/:id/recusar — cliente recusa o orçamento
router.put('/:id/recusar', autenticar, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (String(pedido.cliente) !== req.usuario.id) {
      return res.status(403).json({ erro: 'Sem permissão' });
    }
    if (pedido.status !== 'orcado') {
      return res.status(400).json({ erro: 'O pedido não está aguardando aceite' });
    }

    pedido.status = 'recusado_cliente';
    await pedido.save();
    res.json(await popularPedido(Pedido.findById(pedido._id)));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao recusar orçamento', detalhe: err.message });
  }
});

// PUT /api/pedidos/:id/cancelar — cliente cancela o pedido (só antes de pagar)
router.put('/:id/cancelar', autenticar, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (String(pedido.cliente) !== req.usuario.id) {
      return res.status(403).json({ erro: 'Sem permissão' });
    }
    if (!CANCELAVEIS.includes(pedido.status)) {
      return res.status(400).json({ erro: 'Este pedido não pode mais ser cancelado' });
    }

    pedido.status = 'cancelado';
    await pedido.save();

    const cliente = await User.findById(pedido.cliente).select('nome');
    notificarArtistaCancelamento(pedido, cliente?.nome); // avisa o artista

    res.json(await popularPedido(Pedido.findById(pedido._id)));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cancelar pedido', detalhe: err.message });
  }
});

// Só o dono do pedido ou um admin podem mexer no cupom.
async function podeMexer(pedido, usuario) {
  return String(pedido.cliente) === usuario.id || usuario.role === 'admin';
}

// PUT /api/pedidos/:id/cupom — cliente ou artista aplica um cupom (desconto no total)
router.put('/:id/cupom', autenticar, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (!(await podeMexer(pedido, req.usuario))) return res.status(403).json({ erro: 'Sem permissão' });
    if (!pedido.valorTotal || pedido.valorTotal <= 0) {
      return res.status(400).json({ erro: 'O orçamento ainda não foi feito' });
    }

    const codigo = (req.body.codigo || '').trim().toUpperCase();
    const cupom = codigo ? await Cupom.findOne({ codigo, ativo: true }) : null;
    if (!cupom) return res.status(400).json({ erro: 'Cupom inválido ou inativo' });

    // Limite de usos por usuário: conta OUTROS pedidos deste cliente que já usam o cupom
    // (ignora este pedido e os cancelados/recusados).
    if (cupom.usosPorUsuario > 0) {
      const usados = await Pedido.countDocuments({
        cliente: pedido.cliente,
        cupom: cupom.codigo,
        _id: { $ne: pedido._id },
        status: { $nin: ['cancelado', 'recusado_cliente'] },
      });
      if (usados >= cupom.usosPorUsuario) {
        return res.status(400).json({
          erro:
            cupom.usosPorUsuario === 1
              ? 'Você já usou este cupom.'
              : `Você já usou este cupom o máximo de vezes (${cupom.usosPorUsuario}).`,
        });
      }
    }

    pedido.cupom = cupom.codigo;
    pedido.descontoValor = cupom.desconto(pedido.valorTotal);
    await pedido.save();
    res.json(await popularPedido(Pedido.findById(pedido._id)));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao aplicar cupom', detalhe: err.message });
  }
});

// DELETE /api/pedidos/:id/cupom — remove o cupom aplicado
router.delete('/:id/cupom', autenticar, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (!(await podeMexer(pedido, req.usuario))) return res.status(403).json({ erro: 'Sem permissão' });
    pedido.cupom = undefined;
    pedido.descontoValor = 0;
    await pedido.save();
    res.json(await popularPedido(Pedido.findById(pedido._id)));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover cupom', detalhe: err.message });
  }
});

export default router;
