import { Router } from 'express';
import Portfolio from '../models/Portfolio.js';

const router = Router();

// GET /api/portfolio — trabalhos adicionados pelo artista (público), do mais novo para o mais antigo.
router.get('/', async (req, res) => {
  try {
    const itens = await Portfolio.find().sort({ createdAt: -1 }).select('titulo imagem').lean();
    res.json(itens);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar o portfólio', detalhe: err.message });
  }
});

export default router;
