/**
 * Bot do Discord: abre um "ticket" (canal por pedido) quando o cliente aceita o
 * orçamento, com todas as informações do model, e posta atualizações de status
 * (entrou na fila, em produção, concluído).
 *
 * Config via .env:
 *   DISCORD_BOT_TOKEN          -> token do bot (Discord Developer Portal)
 *   DISCORD_GUILD_ID           -> ID do servidor
 *   DISCORD_TICKET_CATEGORY_ID -> ID da categoria onde os tickets são criados (opcional)
 *   DISCORD_CONVITE            -> link de convite do servidor (mostrado ao cliente)
 *
 * Sem DISCORD_BOT_TOKEN, roda em modo simulação (loga no console). O bot próprio
 * convive com outros bots (ex: Ticket Tool) no mesmo servidor sem conflito.
 */
import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  OverwriteType,
} from 'discord.js';

const {
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,
  DISCORD_TICKET_CATEGORY_ID,
  DISCORD_CONVITE,
  DISCORD_ADMIN_IDS,
  PIX_CHAVE,
  PIX_NOME,
} = process.env;

const ADMIN_IDS = (DISCORD_ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);

export const DISCORD_ATIVO = !!(DISCORD_BOT_TOKEN && DISCORD_GUILD_ID);
export const DISCORD_CONVITE_URL = DISCORD_CONVITE || '';

let client = null;
let pronto = false;

export function iniciarBot() {
  if (!DISCORD_ATIVO) {
    console.log('💬 Discord em modo simulação (sem DISCORD_BOT_TOKEN) — tickets só logam no console.');
    return;
  }
  client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.once('clientReady', () => {
    pronto = true;
    console.log(`💬 Bot do Discord conectado como ${client.user.tag}`);
  });
  // compat: alguns ambientes ainda emitem 'ready'
  client.once('ready', () => {
    pronto = true;
  });
  client.login(DISCORD_BOT_TOKEN).catch((e) =>
    console.error('Erro ao conectar o bot do Discord:', e.message)
  );
}

const fmtBRL = (v) => (v != null ? 'R$ ' + Number(v).toFixed(2).replace('.', ',') : '—');
const DIVISOR = '━'.repeat(34);

// Uma linha "• Nome [ detalhes ] — R$ x,xx"
function itemLinha(it) {
  const nome = it.variante?.nome || 'Item';
  const detalhes = [];
  if (it.cor) detalhes.push(it.cor);
  if (it.observacao) detalhes.push(it.observacao);
  if (it.descricoes?.length) detalhes.push(...it.descricoes.filter(Boolean));
  const extra = detalhes.length ? ` [ ${detalhes.join(', ')} ]` : '';
  const qtd = it.quantidade > 1 ? ` ×${it.quantidade}` : '';
  const valor = it.valorAprovado != null ? ` — ${fmtBRL(it.valorAprovado * (it.quantidade || 1))}` : '';
  return `• ${nome}${qtd}${extra}${valor}`;
}

// Lista de itens do pedido (agrupada por personagem quando há mais de um).
function resumoDoPedido(pedido) {
  const linhas = [];
  if (pedido.tipo === 'model') {
    const varias = (pedido.versoes || []).length > 1;
    for (const v of pedido.versoes || []) {
      if (varias) linhas.push(`**${v.nome}**`);
      for (const it of v.itens || []) linhas.push(itemLinha(it));
      if (varias) linhas.push('');
    }
  } else {
    for (const it of pedido.itensAvulsos || []) linhas.push(itemLinha(it));
  }
  for (const ip of pedido.itensPersonalizados || []) {
    linhas.push(`• ${ip.tipo} [ ${ip.descricao} ]${ip.valor != null ? ` — ${fmtBRL(ip.valor)}` : ''}`);
  }
  return linhas.join('\n') || '(sem itens)';
}

// Mensagem do orçamento no ticket (formato pedido pelo artista).
export function mensagemOrcamento(pedido, clienteRef) {
  const modelo =
    pedido.tipo === 'model' ? (pedido.versoes || []).map((v) => v.nome).join(', ') || '—' : 'Item avulso';
  const total = (pedido.valorTotal || 0) - (pedido.descontoValor || 0);
  const desconto = pedido.descontoValor
    ? `\n~~${fmtBRL(pedido.valorTotal)}~~ · cupom ${pedido.cupom}: −${fmtBRL(pedido.descontoValor)}`
    : '';
  const obs = pedido.observacaoAdmin ? `\n\nObservações: ${pedido.observacaoAdmin}` : '';
  const msg =
    `## 🐝 Orçamento — Pedido #${pedido.numero || '?'}\n` +
    `**Cliente:** ${clienteRef}\n` +
    `**Modelo:** ${modelo}\n${DIVISOR}\n\n` +
    `${resumoDoPedido(pedido)}${obs}\n${DIVISOR}\n${desconto}\n` +
    `**Valor Total: ${fmtBRL(total)}**`;
  return msg.slice(0, 1990);
}

// Mensagem da forma de pagamento (Pix + comprovante no ticket).
export function mensagemPagamento() {
  return (
    `**[ Forma de Pagamento ]**\n` +
    `Pagamento via Pix, sendo **50% no início e 50% ao final** do trabalho, garantindo segurança para ambas as partes.\n\n` +
    `**Chave Pix:** ${PIX_CHAVE || '(configure PIX_CHAVE no .env)'}\n` +
    `**Nome:** ${PIX_NOME || '(configure PIX_NOME no .env)'}\n\n` +
    `⚠️ Faça o Pix da entrada (50%) e **envie o comprovante aqui no ticket**. Assim que o artista confirmar o pagamento, seu pedido entra na fila de produção. 🐝`
  );
}

/**
 * Cria o canal/ticket do pedido e posta as informações.
 * @returns {{ canalId, canalUrl } | null}
 */
export async function abrirTicket(pedido) {
  const nomeCliente = pedido.cliente?.nome || 'cliente';
  if (!DISCORD_ATIVO || !pronto) {
    console.log(`💬 [SIMULAÇÃO] Abriria ticket no Discord do pedido ${pedido._id} (${nomeCliente}).`);
    return null;
  }
  try {
    const guild = await client.guilds.fetch(DISCORD_GUILD_ID);

    // Se o cliente logou via Discord, criamos um canal PRIVADO liberando só ele,
    // os artistas (admins) e o próprio bot. Sem discordId, o canal herda a categoria.
    const clienteDiscordId = pedido.cliente?.discordId;
    const acesso = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.ReadMessageHistory,
    ];
    // OverwriteType.Role para o @everyone (id = guild.id); Member para os usuários.
    const permissionOverwrites = clienteDiscordId
      ? [
          { id: guild.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
          { id: clienteDiscordId, type: OverwriteType.Member, allow: acesso },
          { id: client.user.id, type: OverwriteType.Member, allow: acesso }, // o bot posta atualizações
          ...ADMIN_IDS.map((id) => ({ id, type: OverwriteType.Member, allow: acesso })),
        ]
      : undefined;

    // nome do canal = número do pedido + nome do personagem (organizado)
    const personagem = pedido.tipo === 'model' ? pedido.versoes?.[0]?.nome || 'model' : 'avulso';
    const nomeCanal = `${pedido.numero ? pedido.numero + '-' : ''}${personagem}`
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'pedido';

    const opcoes = {
      name: nomeCanal,
      type: ChannelType.GuildText,
      topic: `Pedido #${pedido.numero || '?'} — ${nomeCliente}`,
      permissionOverwrites,
    };

    let canal;
    try {
      canal = await guild.channels.create({ ...opcoes, parent: DISCORD_TICKET_CATEGORY_ID || undefined });
    } catch (e) {
      // DISCORD_TICKET_CATEGORY_ID inválido/não é categoria → cria fora da categoria
      console.error('Aviso: categoria de tickets inválida, criando fora dela.', e.message);
      canal = await guild.channels.create(opcoes);
    }

    // Quem receber o ping: mention (se logou pelo Discord) → @handle informado → nome.
    const clienteRef = clienteDiscordId ? `<@${clienteDiscordId}>` : pedido.discordUsuario || nomeCliente;

    // 1) o orçamento formatado (com ping no cliente)   2) a forma de pagamento
    await canal.send(mensagemOrcamento(pedido, clienteRef));
    await canal.send(mensagemPagamento());

    return { canalId: canal.id, canalUrl: `https://discord.com/channels/${DISCORD_GUILD_ID}/${canal.id}` };
  } catch (e) {
    console.error('Erro ao abrir ticket no Discord:', e.message);
    return null;
  }
}

// Posta uma mensagem de atualização no ticket do pedido (fila, produção, etc.).
export async function postarNoTicket(pedido, mensagem) {
  if (!DISCORD_ATIVO || !pronto || !pedido?.discordCanalId) {
    console.log(`💬 [SIMULAÇÃO] Ticket ${pedido?._id}: ${mensagem}`);
    return;
  }
  try {
    const canal = await client.channels.fetch(pedido.discordCanalId);
    await canal.send(mensagem);
  } catch (e) {
    console.error('Erro ao postar no ticket do Discord:', e.message);
  }
}
