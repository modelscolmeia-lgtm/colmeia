import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  senhaHash: { type: String }, // opcional: contas via Discord não têm senha
  role: { type: String, enum: ['cliente', 'admin'], default: 'cliente' },
  // login via Discord (OAuth)
  discordId: { type: String, unique: true, sparse: true },
  discordUsername: { type: String },
  avatar: { type: String },
  // recuperação de senha
  resetTokenHash: { type: String },
  resetTokenExpira: { type: Date },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
