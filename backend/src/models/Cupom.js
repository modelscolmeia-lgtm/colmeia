import mongoose from 'mongoose';

const cupomSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  tipo: { type: String, enum: ['percentual', 'fixo'], default: 'percentual' },
  valor: { type: Number, required: true }, // % (0-100) ou R$ (fixo)
  descricao: { type: String },
  usosPorUsuario: { type: Number, default: 0 }, // máx. de usos por cliente (0 = ilimitado)
  ativo: { type: Boolean, default: true },
}, { timestamps: true });

// Calcula o desconto (em R$) deste cupom sobre um total.
cupomSchema.methods.desconto = function (total) {
  const t = Number(total) || 0;
  const bruto = this.tipo === 'percentual' ? (t * this.valor) / 100 : this.valor;
  return Math.min(Math.max(0, Math.round(bruto * 100) / 100), t); // nunca passa do total
};

export default mongoose.model('Cupom', cupomSchema);
