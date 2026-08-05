import mongoose from 'mongoose';

// Uma cor da variante (ex: pets prontos): nome + imagem própria.
const corSchema = new mongoose.Schema({
  nome: { type: String, required: true },   // "Azul", "Vermelho"...
  imagem: { type: String },                 // imagem daquela cor (URL ou /uploads/...)
}, { _id: false });

const varianteSchema = new mongoose.Schema({
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoriaItem', required: true },
  nome: { type: String, required: true },        // "Longo", "Detalhado"...
  precoMin: { type: Number, required: true },
  precoMax: { type: Number },                      // null/undefined se preço fixo
  imagemExemplo: { type: String },                 // URL da imagem
  descricao: { type: String },
  cores: [corSchema],                              // cores selecionáveis (troca a imagem)
  ativo: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Variante', varianteSchema);
