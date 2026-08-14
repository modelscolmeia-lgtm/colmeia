import { Router } from 'express';
import { listarTipos } from '../services/tipos.js';

const router = Router();

// GET /api/tipos — categorias-mãe ativas (para as abas do Fazer Pedido). Público.
router.get('/', async (req, res) => {
  try {
    res.json(await listarTipos({ soAtivos: true }));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar tipos', detalhe: err.message });
  }
});

export default router;
