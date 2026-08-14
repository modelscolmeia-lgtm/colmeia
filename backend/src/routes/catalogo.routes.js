import { Router } from 'express';
import CategoriaItem from '../models/CategoriaItem.js';
import Variante from '../models/Variante.js';

const router = Router();

// GET /api/catalogo — lista categorias (com suas variantes ativas), agrupadas.
// Público: o cliente precisa ver o catálogo antes mesmo de logar.
// Query opcional: ?tipo=model | ?tipo=item_avulso
router.get('/', async (req, res) => {
  try {
    const filtroCategoria = { ativo: { $ne: false } }; // esconde categorias desativadas
    if (req.query.tipo) filtroCategoria.tipo = req.query.tipo;

    const categorias = await CategoriaItem.find(filtroCategoria).sort({ ordem: 1, nome: 1 }).lean();
    const variantes = await Variante.find({ ativo: true }).sort({ precoMin: 1 }).lean();

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

export default router;
