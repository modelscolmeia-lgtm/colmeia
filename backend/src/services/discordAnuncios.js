// Anúncios no Discord da Colmeia. Cada anúncio publicado no site vai para um canal do servidor por um
// webhook (Configurações do canal > Integrações > Webhooks > Copiar URL), podendo marcar @everyone.
// Editar ou apagar o anúncio no site edita ou apaga a mensagem no Discord também.
//
// Configuração (no .env e no Render): sem DISCORD_WEBHOOK_ANUNCIOS, nada é enviado (só o site).
//   DISCORD_WEBHOOK_ANUNCIOS  endereço do webhook do canal (https://discord.com/api/webhooks/...)
//   APP_URL                   endereço do site, usado no link do anúncio
import Anuncio from '../models/Anuncio.js';

const cfg = () => ({
  webhook: (process.env.DISCORD_WEBHOOK_ANUNCIOS || '').trim(),
  site: (process.env.APP_URL || '').trim().replace(/\/+$/, ''),
});
export const webhookAtivo = () => /^https?:\/\//.test(cfg().webhook);

export const MARCAR = ['nao', 'ninguem', 'todos'];

const ESTILO = {
  comum: { emoji: '📢', cor: 0xffb800, rotulo: '' },
  importante: { emoji: '⚠️', cor: 0xe08a2e, rotulo: 'Importante' },
  urgente: { emoji: '🚨', cor: 0xff6b84, rotulo: 'URGENTE' },
};

// Monta a mensagem. Só marca @everyone quando o autor escolheu: nada escrito no texto pinga ninguém.
function montar(a) {
  const e = ESTILO[a.importancia] || ESTILO.comum;
  const todos = a.discordMarcar === 'todos';
  const { site } = cfg();
  const embed = {
    title: `${e.emoji} ${a.titulo}`.slice(0, 256),
    description: String(a.conteudo || '').slice(0, 4000) || undefined,
    color: e.cor,
    author: { name: `${a.autorNome || 'Colmeia'}${e.rotulo ? ` · ${e.rotulo}` : ''}`.slice(0, 256) },
    footer: { text: 'Colmeia · Anúncios' },
    timestamp: new Date(a.createdAt || Date.now()).toISOString(),
  };
  if (site) embed.url = `${site}/anuncios`;
  if (/^https:\/\//.test(a.imagem || '')) embed.image = { url: a.imagem };
  return {
    content: todos ? '@everyone' : '',
    embeds: [embed],
    allowed_mentions: { parse: todos ? ['everyone'] : [] },
  };
}

// Uma chamada ao webhook. Espera e tenta de novo uma vez se o Discord pedir calma.
async function chamar(metodo, sufixo, corpo, tentativa = 0) {
  const opcoes = { method: metodo };
  if (corpo) {
    opcoes.headers = { 'Content-Type': 'application/json' };
    opcoes.body = JSON.stringify(corpo);
  }
  const r = await fetch(`${cfg().webhook}${sufixo}`, opcoes);
  if (r.status === 429 && tentativa < 1) {
    const espera = Math.min(10, Number((await r.json().catch(() => ({}))).retry_after) || 2);
    await new Promise((ok) => setTimeout(ok, espera * 1000));
    return chamar(metodo, sufixo, corpo, tentativa + 1);
  }
  if (r.status === 404 && metodo !== 'POST') return null; // a mensagem foi apagada no Discord
  if (!r.ok) throw new Error(`Discord respondeu ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}

// Publica, atualiza ou tira do Discord a mensagem do anúncio, conforme a escolha do autor.
// Nunca lança erro: devolve { estado } ou { erro } para o painel mostrar o que aconteceu.
export async function sincronizar(id) {
  if (!webhookAtivo()) return { estado: 'desligado' };
  try {
    const a = await Anuncio.findById(id);
    if (!a) return { estado: 'sem-anuncio' };
    if (a.discordMarcar === 'nao') {
      if (a.discordMsg) {
        await chamar('DELETE', `/messages/${a.discordMsg}`);
        a.discordMsg = undefined;
        await a.save();
        return { estado: 'removido' };
      }
      return { estado: 'nao-enviado' };
    }
    const corpo = montar(a);
    if (a.discordMsg) {
      const r = await chamar('PATCH', `/messages/${a.discordMsg}`, corpo); // editar não pinga de novo
      if (r) return { estado: 'atualizado' };
      // apagaram a mensagem no Discord: manda de novo
    }
    const msg = await chamar('POST', '?wait=true', corpo);
    if (msg?.id) {
      a.discordMsg = String(msg.id);
      await a.save();
    }
    return { estado: 'enviado' };
  } catch (e) {
    console.error('Anúncio no Discord:', e.message);
    return { erro: e.message };
  }
}

export async function apagarNoDiscord(discordMsg) {
  if (!webhookAtivo() || !discordMsg) return;
  try {
    await chamar('DELETE', `/messages/${discordMsg}`);
  } catch (e) {
    console.error('Apagar anúncio no Discord:', e.message);
  }
}
