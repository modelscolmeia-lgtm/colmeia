import mongoose from 'mongoose';

// Configurações gerais do site (documento único, _id: 'geral').
// Editável pelos admins no painel. Hoje guarda o limite da fila.
const configSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'geral' },
    filaLimite: { type: Number, default: 5, min: 1 },
  },
  { timestamps: true }
);

export default mongoose.model('Config', configSchema);
