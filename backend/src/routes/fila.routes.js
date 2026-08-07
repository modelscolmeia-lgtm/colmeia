import { Router } from 'express';
import Pedido from '../models/Pedido.js';
import { autenticar } from '../middleware/auth.js';
import { LIMITE_FILA, contarFila } from '../services/fila.js';

const router = Router();

// GET /api/fila/status — quantos pedidos há na fila e se ela está cheia (bloqueia novos pedidos).
router.get('/status', autenticar, async (req, res) => {
  try {
    const emFila = await contarFila();
    res.json({ emFila, limite: LIMITE_FILA, cheia: emFila >= LIMITE_FILA });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao consultar a fila', detalhe: err.message });
  }
});

// GET /api/fila — fila de produção visível para qualquer usuário logado.
// Mostra posição, status, prazo e o primeiro nome do cliente (sem dados sensíveis).
router.get('/', autenticar, async (req, res) => {
  try {
    const pedidos = await Pedido.find({ status: { $in: ['em_producao', 'fila_producao'] } })
      .sort({ posicaoFila: 1 })
      .populate('cliente', 'nome')
      .select('cliente status posicaoFila dataEntrouProducao prazoEstimado tipo')
      .lean();

    const fila = pedidos.map((p, i) => ({
      posicao: i + 1,
      pedidoId: p._id,
      tipo: p.tipo,
      status: p.status,
      cliente: p.cliente?.nome?.split(' ')[0] || 'Cliente',
      meu: String(p.cliente?._id) === req.usuario.id,
      dataEntrouProducao: p.dataEntrouProducao,
      prazoEstimado: p.prazoEstimado,
    }));

    res.json(fila);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar fila', detalhe: err.message });
  }
});

export default router;
