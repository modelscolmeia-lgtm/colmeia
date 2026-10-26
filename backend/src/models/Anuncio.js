import mongoose from 'mongoose';

// Anúncios do artista (aparecem na seção "Anúncios" e podem ir para o Discord por webhook).
const anuncioSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true, maxlength: 120 },
    conteudo: { type: String, trim: true, maxlength: 4000, default: '' },
    importancia: { type: String, enum: ['comum', 'importante', 'urgente'], default: 'comum' },
    imagem: { type: String, trim: true }, // opcional: URL https (Cloudinary) ou /uploads/...
    fixado: { type: Boolean, default: false },
    autorNome: { type: String, trim: true },
    // Discord: 'nao' (só no site), 'ninguem' (manda sem marcar) ou 'todos' (marca @everyone)
    discordMarcar: { type: String, enum: ['nao', 'ninguem', 'todos'], default: 'nao' },
    discordMsg: { type: String }, // id da mensagem no canal, para editar/apagar junto
  },
  { timestamps: true }
);

export default mongoose.model('Anuncio', anuncioSchema);
