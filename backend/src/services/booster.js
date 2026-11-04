import User from '../models/User.js';
import { getSite } from './site.js';
import { statusBooster } from './discord.js';

const MENSAGENS = {
  sem_discord: 'Para fazer um pedido, entre no site com o seu Discord.',
  fora_do_servidor: 'No momento, os pedidos são só para quem dá boost no servidor do Discord. Entre no servidor e dê boost para pedir.',
  nao_booster: 'No momento, os pedidos são só para quem dá boost no servidor do Discord.',
  indisponivel: 'Não consegui conferir o seu boost agora. Tente de novo em instantes.',
};

// Decide se a pessoa pode fazer pedido. Artistas (admin) sempre podem; sem a regra ligada, todos podem.
// A conferência é feita na hora (o boost pode acabar), pelo bot do servidor.
export async function podePedir({ id, role }) {
  if (role === 'admin') return { ok: true };
  const { somenteBoosters } = await getSite();
  if (!somenteBoosters) return { ok: true, somenteBoosters: false };

  const user = await User.findById(id).select('discordId').lean();
  if (!user?.discordId) return { ok: false, somenteBoosters, codigo: 'sem_discord', mensagem: MENSAGENS.sem_discord };

  const estado = await statusBooster(user.discordId);
  if (estado === 'booster' || estado === 'simulacao') return { ok: true, somenteBoosters };
  return { ok: false, somenteBoosters, codigo: estado, mensagem: MENSAGENS[estado] || MENSAGENS.indisponivel };
}
