import mongoose from 'mongoose';

// Contador sequencial atômico (ex: número do pedido). Evita corridas/duplicatas.
const counterSchema = new mongoose.Schema({
  _id: { type: String },      // nome do contador, ex: 'pedido'
  seq: { type: Number, default: 0 },
});

// Incrementa e devolve o próximo número.
counterSchema.statics.proximo = async function (nome) {
  const doc = await this.findByIdAndUpdate(
    nome,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

export default mongoose.model('Counter', counterSchema);
