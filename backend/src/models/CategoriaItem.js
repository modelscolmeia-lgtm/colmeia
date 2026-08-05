import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
  nome: { type: String, required: true },       // "Cabelo", "Chifres"...
  slug: { type: String, required: true, unique: true },
  // 'model' aparece na montagem do model; 'item_avulso' é pedido separado (Espada, Cajado, Escudo)
  tipo: { type: String, enum: ['model', 'item_avulso'], default: 'model' },
  ordem: { type: Number, default: 0 },
  permiteMultiplaSelecao: { type: Boolean, default: false }, // ex: acessórios pode ter mais de um
  permiteQuantidade: { type: Boolean, default: false },      // ex: 6 chifres
  // um campo de texto por unidade (ex: Expressões — o cliente descreve cada expressão)
  textoPorQuantidade: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('CategoriaItem', categoriaSchema);
