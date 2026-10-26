import mongoose from 'mongoose';

// Trabalhos do portfólio adicionados pelo artista pelo site.
// (As imagens fixas do começo ficam em frontend/public/portfolio e em src/data/portfolio.json.)
const portfolioSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true, maxlength: 120 },
    imagem: { type: String, required: true, trim: true }, // URL pública (Cloudinary) ou caminho /uploads/...
  },
  { timestamps: true }
);

export default mongoose.model('Portfolio', portfolioSchema);
