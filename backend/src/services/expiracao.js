/**
 * Expiração de orçamentos sem resposta.
 *
 * Quando o artista envia um orçamento (status 'orcado'), o cliente tem
 * VALIDADE_ORCAMENTO_DIAS para aceitar ou recusar. Passado o prazo, o pedido
 * vira 'expirado' e sai das telas ativas (o artista pode excluir depois).
 *
 * Roda de hora em hora enquanto o servidor está no ar.
 */
import Pedido, { VALIDADE_ORCAMENTO_DIAS } from '../models/Pedido.js';
import User from '../models/User.js';
import { enviarDM } from './discord.js';

const DIA = 86400000;

// Pedidos orçados que já passaram do prazo de resposta.
// Pedidos antigos (sem dataOrcado) caem no updatedAt como referência.
function filtroVencidos() {
  const limite = new Date(Date.now() - VALIDADE_ORCAMENTO_DIAS * DIA);
  return {
    status: 'orcado',
    $or: [
      { dataOrcado: { $ne: null, $lte: limite } },
      { dataOrcado: null, updatedAt: { $lte: limite } },
      { dataOrcado: { $exists: false }, updatedAt: { $lte: limite } },
    ],
  };
}

// Só lista quem expiraria (não altera nada) — usado para conferir antes.
export async function listarVencidos() {
  return Pedido.find(filtroVencidos())
    .select('numero cliente dataOrcado updatedAt valorTotal')
    .populate('cliente', 'nome')
    .lean();
}

// Expira de fato e avisa cada cliente no Discord. Devolve quantos expiraram.
export async function expirarOrcamentos() {
  const vencidos = await Pedido.find(filtroVencidos()).select('numero cliente');
  for (const p of vencidos) {
    p.status = 'expirado';
    await p.save();
    try {
      const dono = await User.findById(p.cliente).select('discordId');
      if (dono?.discordId) {
        await enviarDM(
          dono.discordId,
          `⌛ **Seu orçamento da Colmeia expirou**\n\n` +
            `O pedido **#${p.numero}** ficou ${VALIDADE_ORCAMENTO_DIAS} dias sem resposta, ` +
            `então foi encerrado para liberar espaço na fila.\n\n` +
            `Sem problemas! Se ainda quiser, é só fazer um novo pedido no site. 🐝`
        );
      }
    } catch { /* aviso é best-effort */ }
  }
  if (vencidos.length) {
    console.log(`⌛ ${vencidos.length} orçamento(s) expiraram por falta de resposta.`);
  }
  return vencidos.length;
}

// Agenda a checagem (na subida e de hora em hora).
export function agendarExpiracao() {
  const rodar = () => expirarOrcamentos().catch((e) => console.error('Erro ao expirar orçamentos:', e.message));
  setTimeout(rodar, 30_000);          // 30s após subir, já confere
  setInterval(rodar, 60 * 60 * 1000); // depois, de hora em hora
}
