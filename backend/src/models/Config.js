import mongoose from 'mongoose';

// Configurações gerais do site (documento único, _id: 'geral').
// Editável pelos admins no painel. Guarda o limite da fila e o estado do site (aberto/pausado).
const configSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'geral' },
    filaLimite: { type: Number, default: 5, min: 1 },
    // "Liga/desliga" do site para os clientes (admins continuam entrando).
    siteAberto: { type: Boolean, default: true },
    mensagemPausa: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true }
);

export default mongoose.model('Config', configSchema);
