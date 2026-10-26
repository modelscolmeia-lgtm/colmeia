import mongoose from 'mongoose';

// Trabalhos fixos do portfólio (os que vêm junto do código) que o artista escondeu.
// A chave é o caminho da imagem, como está em frontend/src/data/portfolio.json.
const portfolioOcultoSchema = new mongoose.Schema({ chave: { type: String, required: true, unique: true } }, { timestamps: true });

export default mongoose.model('PortfolioOculto', portfolioOcultoSchema);
