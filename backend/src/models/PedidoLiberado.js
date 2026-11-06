import mongoose from 'mongoose';

// Pessoas que o artista liberou para fazer pedido mesmo sem dar boost (vale só com a regra "só boosters" ligada).
// A chave é o ID do Discord, então a pessoa pode ser liberada antes mesmo de entrar no site.
const pedidoLiberadoSchema = new mongoose.Schema(
  {
    discordId: { type: String, required: true, unique: true },
    nome: { type: String, trim: true, maxlength: 80 }, // só para o artista reconhecer a pessoa na lista
  },
  { timestamps: true }
);

export default mongoose.model('PedidoLiberado', pedidoLiberadoSchema);
