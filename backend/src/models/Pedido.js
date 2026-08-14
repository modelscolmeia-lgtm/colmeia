import mongoose from 'mongoose';

// Um item escolhido pelo cliente (uma variante do catálogo + quantidade)
const itemSelecionadoSchema = new mongoose.Schema({
  variante: { type: mongoose.Schema.Types.ObjectId, ref: 'Variante', required: true },
  quantidade: { type: Number, default: 1, min: 1 },
  observacao: { type: String },          // texto livre do cliente
  cor: { type: String },                 // cor escolhida (ex: pets prontos)
  descricoes: [{ type: String }],        // um texto por unidade (ex: expressões)
  valorAprovado: { type: Number },        // definido pelo admin na precificação
}, { _id: false });

// Uma versão do model (ex: "Versão A: pele negra + cabelo azul")
const versaoModelSchema = new mongoose.Schema({
  nome: { type: String, required: true },        // "Versão A", "Versão Negra"...
  itens: [itemSelecionadoSchema],
  valorAprovado: { type: Number },                // total da versão (admin define)
}, { _id: false });

// Pedido de texto livre, precificado 100% pelo admin
const itemPersonalizadoSchema = new mongoose.Schema({
  tipo: { type: String, required: true },     // "Item Específico", "Pet Específico"...
  descricao: { type: String, required: true },// texto livre do cliente
  valor: { type: Number },                     // definido só pelo admin
}, { _id: false });

const STATUS = [
  'pendente_aprovacao',
  'orcado',
  'recusado_cliente',
  'cancelado',
  // cliente aceitou → paga a entrada e envia o comprovante no ticket; artista confirma
  'aguardando_pagamento',
  'fila_producao', // pagamento confirmado → entra na fila (atendimento segue no Discord)
  'em_producao',
  'concluido',
];

const pedidoSchema = new mongoose.Schema({
  numero: { type: Number },  // número sequencial do pedido (ex: #42)
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // slug da categoria-mãe (Tipo). O comportamento vem do `modo` abaixo.
  tipo: { type: String, required: true },
  // 'model' usa "versoes" (personagens); 'avulso' usa "itensAvulsos" (lista simples)
  modo: { type: String, enum: ['model', 'avulso'], default: 'avulso' },

  versoes: [versaoModelSchema],
  itensAvulsos: [itemSelecionadoSchema],
  itensPersonalizados: [itemPersonalizadoSchema],

  aceiteTermo: {
    aceito: { type: Boolean, default: false },
    dataAceite: { type: Date },
  },

  status: { type: String, enum: STATUS, default: 'pendente_aprovacao' },

  valorTotal: { type: Number },
  cupom: { type: String },              // código do cupom aplicado
  descontoValor: { type: Number, default: 0 }, // desconto em R$
  observacaoAdmin: { type: String },

  // Atendimento no Discord (ticket criado quando o cliente aceita o orçamento)
  discordUsuario: { type: String },   // @ do cliente no Discord (informado no pedido)
  discordCanalId: { type: String },   // id do canal/ticket criado
  discordCanalUrl: { type: String },  // link para o ticket

  posicaoFila: { type: Number },
  dataEntrouProducao: { type: Date },
  prazoEstimado: {
    min: { type: Number, default: 20 },
    max: { type: Number, default: 45 },
  },
}, { timestamps: true });

export const STATUS_PEDIDO = STATUS;
export default mongoose.model('Pedido', pedidoSchema);
