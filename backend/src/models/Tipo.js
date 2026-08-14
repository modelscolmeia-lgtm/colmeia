import mongoose from 'mongoose';

// "Categoria-mãe" (ex: Model, Item Avulso). Editável/criável pelo admin.
// `modo` define o comportamento no Fazer Pedido:
//   'model'  -> monta personagens (versoes[])
//   'avulso' -> lista simples de itens num pedido à parte (itensAvulsos[])
const tipoSchema = new mongoose.Schema(
  {
    _id: { type: String }, // slug, ex: 'model', 'item_avulso', 'comissoes'
    nome: { type: String, required: true },
    modo: { type: String, enum: ['model', 'avulso'], default: 'avulso' },
    ordem: { type: Number, default: 0 },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Tipo', tipoSchema);
