import Pedido from '../models/Pedido.js';
import Config from '../models/Config.js';
import {
  notificarClienteEmProducao,
  notificarClienteProximoNaFila,
} from './email.js';
import { postarNoTicket } from './discord.js';

// Limite padrão (usado se ainda não houver config salva no banco). Env FILA_LIMITE ou 5.
export const LIMITE_FILA_PADRAO = Number(process.env.FILA_LIMITE) || 5;

// Máximo de pedidos na fila de produção (em_producao + fila_producao) ao mesmo tempo.
// Guardado no banco (Config) e editável pelos admins no painel.
export async function getLimiteFila() {
  const c = await Config.findById('geral').select('filaLimite').lean();
  return c?.filaLimite ?? LIMITE_FILA_PADRAO;
}

// Atualiza o limite (mínimo 1). Devolve o valor efetivamente salvo.
export async function setLimiteFila(n) {
  const limite = Math.max(1, Math.floor(Number(n) || 0));
  const c = await Config.findByIdAndUpdate(
    'geral',
    { filaLimite: limite },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return c.filaLimite;
}

// Quantos pedidos estão hoje na fila de produção (contam para o limite).
export function contarFila() {
  return Pedido.countDocuments({ status: { $in: ['fila_producao', 'em_producao'] } });
}

/**
 * Próxima posição livre na fila (maior posicaoFila atual + 1),
 * considerando pedidos que já estão na fila ou em produção.
 */
async function proximaPosicaoFila() {
  const ultimo = await Pedido.findOne({
    status: { $in: ['fila_producao', 'em_producao'] },
  })
    .sort({ posicaoFila: -1 })
    .select('posicaoFila');

  return (ultimo?.posicaoFila ?? 0) + 1;
}

/**
 * Promove o próximo pedido da fila para "em_producao", mas só se
 * não houver nenhum pedido já em produção (produção é uma de cada vez).
 * Retorna o pedido promovido ou null.
 */
export async function promoverProximo() {
  const emProducao = await Pedido.findOne({ status: 'em_producao' });
  if (emProducao) return null;

  const proximo = await Pedido.findOne({ status: 'fila_producao' }).sort({
    posicaoFila: 1,
  });
  if (!proximo) return null;

  proximo.status = 'em_producao';
  proximo.dataEntrouProducao = new Date();
  await proximo.save();

  // avisa quem entrou em produção (e-mail + ticket do Discord)
  notificarClienteEmProducao(proximo);
  postarNoTicket(proximo, '🛠️ **A produção do seu pedido começou!** Prazo estimado: 20 a 45 dias.');

  // avisa o novo primeiro da fila que ele é o próximo
  const novoTopo = await Pedido.findOne({ status: 'fila_producao' }).sort({ posicaoFila: 1 });
  if (novoTopo) {
    notificarClienteProximoNaFila(novoTopo);
    postarNoTicket(novoTopo, '⏫ Você é o **próximo da fila** — sua produção começa em breve.');
  }

  return proximo;
}

/**
 * Coloca um pedido pago na fila de produção: atribui posição e,
 * se ninguém estiver em produção, já o promove para "em_producao".
 */
export async function entrarNaFila(pedido) {
  pedido.status = 'fila_producao';
  pedido.posicaoFila = await proximaPosicaoFila();
  await pedido.save();

  const promovido = await promoverProximo();

  // Se não foi promovido (já há outro em produção) e este pedido é o primeiro
  // da fila de espera, avisa que ele é o próximo a entrar em produção.
  const fuiPromovido = promovido && String(promovido._id) === String(pedido._id);
  if (!fuiPromovido) {
    const emProducao = await Pedido.findOne({ status: 'em_producao' });
    const front = await Pedido.findOne({ status: 'fila_producao' }).sort({ posicaoFila: 1 });
    if (emProducao && front && String(front._id) === String(pedido._id)) {
      notificarClienteProximoNaFila(pedido);
    }
  }
  return pedido;
}
