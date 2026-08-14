import Tipo from '../models/Tipo.js';

// Gera um slug a partir do nome (minúsculo, sem acento, hífens).
export function slugify(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Os dois tipos que sempre existem (semeados na 1ª vez).
const PADROES = [
  { _id: 'model', nome: 'Model', modo: 'model', ordem: 1 },
  { _id: 'item_avulso', nome: 'Item Avulso', modo: 'avulso', ordem: 2 },
];

// Garante que Model e Item Avulso existam (idempotente).
export async function garantirTiposPadrao() {
  for (const p of PADROES) {
    await Tipo.updateOne({ _id: p._id }, { $setOnInsert: p }, { upsert: true });
  }
}

// Lista os tipos (opcionalmente só os ativos), sempre garantindo os padrões.
export async function listarTipos({ soAtivos = false } = {}) {
  await garantirTiposPadrao();
  const filtro = soAtivos ? { ativo: { $ne: false } } : {};
  return Tipo.find(filtro).sort({ ordem: 1, nome: 1 }).lean();
}

// Modo de comportamento de um tipo ('model' | 'avulso'). Fallback seguro.
export async function getModo(slug) {
  const t = await Tipo.findById(slug).select('modo').lean();
  return t?.modo || (slug === 'model' ? 'model' : 'avulso');
}
