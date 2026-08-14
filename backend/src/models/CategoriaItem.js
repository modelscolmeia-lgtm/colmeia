import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
  nome: { type: String, required: true },       // "Cabelo", "Chifres"...
  slug: { type: String, required: true, unique: true },
  // slug da categoria-mãe (Tipo) a que pertence, ex: 'model', 'item_avulso', ou uma nova
  tipo: { type: String, default: 'model' },
  ordem: { type: Number, default: 0 },
  permiteMultiplaSelecao: { type: Boolean, default: false }, // ex: acessórios pode ter mais de um
  permiteQuantidade: { type: Boolean, default: false },      // ex: 6 chifres
  // um campo de texto por unidade (ex: Expressões — o cliente descreve cada expressão)
  textoPorQuantidade: { type: Boolean, default: false },
  // categoria visível no "Fazer pedido"? (false = escondida do cliente, mas fica no admin)
  ativo: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('CategoriaItem', categoriaSchema);
