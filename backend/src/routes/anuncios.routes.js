import { Router } from 'express';
import Anuncio from '../models/Anuncio.js';

const router = Router();

// GET /api/anuncios — lista pública: fixados primeiro, depois do mais novo para o mais antigo.
router.get('/', async (req, res) => {
  try {
    const itens = await Anuncio.find()
      .sort({ fixado: -1, createdAt: -1 })
      .limit(200)
      .select('titulo conteudo importancia imagem fixado autorNome createdAt updatedAt')
      .lean();
    res.json(itens);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar os anúncios', detalhe: err.message });
  }
});

export default router;
