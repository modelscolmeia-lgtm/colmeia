/**
 * Serviço de notificações por e-mail (nodemailer).
 *
 * Configuração via .env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  -> servidor de envio
 *   EMAIL_FROM      -> remetente exibido (default: SMTP_USER)
 *   EMAIL_ARTISTA   -> e-mail do artista p/ avisos internos (default: todos os admins)
 *   APP_URL         -> base do frontend p/ links (default: http://localhost:5173)
 *
 * Modo simulação: se SMTP_USER/SMTP_PASS não estiverem configurados, os e-mails
 * são apenas logados no console (nada é enviado). Assim dá pra testar o fluxo sem
 * credenciais. Basta preencher o SMTP no .env para passar a enviar de verdade.
 *
 * Todas as funções de notificação são "fire-and-forget": capturam os próprios
 * erros e nunca derrubam o fluxo do pedido.
 */
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  EMAIL_ARTISTA,
  APP_URL,
} = process.env;

export const EMAIL_SIMULADO = !SMTP_USER || !SMTP_PASS;
const FROM = EMAIL_FROM || SMTP_USER || 'Colmeia <nao-responder@colmeia.com>';
const BASE = APP_URL || 'http://localhost:5173';

let transporter = null;
if (!EMAIL_SIMULADO) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// Layout simples e legível, no tom da marca.
function montarHtml(titulo, paragrafos, cta) {
  const corpo = paragrafos.map((p) => `<p style="margin:0 0 12px">${p}</p>`).join('');
  const botao = cta
    ? `<p style="margin:20px 0"><a href="${cta.href}" style="background:#ffbd26;color:#000;
        text-decoration:none;font-weight:bold;padding:10px 18px;border:2px solid #000;
        display:inline-block">${cta.texto}</a></p>`
    : '';
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;
       border:4px solid #5d3b23;background:#fff">
    <div style="background:#ffbd26;border-bottom:4px solid #000;padding:16px 20px">
      <span style="font-size:22px;font-weight:bold;color:#000">🐝 Colmeia</span>
    </div>
    <div style="padding:20px;color:#2b2118;font-size:16px;line-height:1.5">
      <h2 style="margin:0 0 14px;color:#5d3b23">${titulo}</h2>
      ${corpo}
      ${botao}
    </div>
    <div style="background:#5d3b23;color:#fff;padding:12px 20px;font-size:13px">
      Colmeia — Minecraft custom models
    </div>
  </div>`;
}

async function enviar({ to, assunto, titulo, paragrafos, cta }) {
  if (!to || (Array.isArray(to) && to.length === 0)) return;
  const destino = Array.isArray(to) ? to.join(', ') : to;

  if (EMAIL_SIMULADO) {
    const linha = cta ? `\n   🔗 ${cta.texto}: ${cta.href}` : '';
    console.log(
      `\n📧 [SIMULAÇÃO] Para: ${destino}\n   Assunto: ${assunto}\n   ${paragrafos
        .map((p) => p.replace(/<[^>]+>/g, ''))
        .join('\n   ')}${linha}\n`
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to: destino,
      subject: assunto,
      html: montarHtml(titulo, paragrafos, cta),
    });
  } catch (err) {
    console.error('Falha ao enviar e-mail:', err.message);
  }
}

// ---------- Resolução de destinatários ----------
async function emailDoCliente(pedido) {
  if (pedido?.cliente?.email) return pedido.cliente.email;
  if (!pedido?.cliente) return null;
  const u = await User.findById(pedido.cliente).select('email');
  return u?.email || null;
}

async function emailsDoArtista() {
  if (EMAIL_ARTISTA) return [EMAIL_ARTISTA];
  const admins = await User.find({ role: 'admin' }).select('email').lean();
  return admins.map((a) => a.email);
}

const linkPedido = (pedido) => `${BASE}/pedido/${pedido._id}`;

// =================== NOTIFICAÇÕES DO CLIENTE ===================

export async function notificarClientePedidoCriado(pedido) {
  const to = await emailDoCliente(pedido);
  await enviar({
    to,
    assunto: '🐝 Recebemos seu pedido!',
    titulo: 'Pedido recebido com sucesso',
    paragrafos: [
      'Seu pedido foi enviado e já está na fila de aprovação do artista.',
      'Assim que o orçamento estiver pronto, você recebe um aviso por aqui para aprovar ou recusar.',
    ],
    cta: { href: linkPedido(pedido), texto: 'Ver meu pedido' },
  });
}

export async function notificarClienteOrcamento(pedido) {
  const to = await emailDoCliente(pedido);
  await enviar({
    to,
    assunto: '🐝 Seu orçamento está pronto',
    titulo: 'Orçamento disponível para aprovação',
    paragrafos: [
      `O artista preparou o orçamento do seu pedido${
        pedido.valorTotal != null ? `: <strong>R$ ${Number(pedido.valorTotal).toFixed(2).replace('.', ',')}</strong>` : ''
      }.`,
      'Acesse o pedido para aprovar e pagar via Pix, ou recusar.',
    ],
    cta: { href: linkPedido(pedido), texto: 'Aprovar ou recusar' },
  });
}

export async function notificarClienteProximoNaFila(pedido) {
  const to = await emailDoCliente(pedido);
  await enviar({
    to,
    assunto: '🐝 Seu pedido está chegando no topo da fila',
    titulo: 'Você é o próximo da fila!',
    paragrafos: [
      'O pedido em produção está sendo finalizado e o seu é o próximo a entrar em produção.',
      'Em breve enviamos o aviso de que a produção começou.',
    ],
    cta: { href: `${BASE}/fila`, texto: 'Ver a fila' },
  });
}

export async function notificarClienteEmProducao(pedido) {
  const to = await emailDoCliente(pedido);
  await enviar({
    to,
    assunto: '🐝 Seu pedido entrou em produção',
    titulo: 'A produção começou!',
    paragrafos: [
      'Seu model entrou em produção agora. 🎉',
      'O prazo estimado de entrega é de <strong>20 a 45 dias</strong> a partir de hoje.',
    ],
    cta: { href: linkPedido(pedido), texto: 'Acompanhar pedido' },
  });
}

export async function notificarClienteProducaoConcluida(pedido) {
  const to = await emailDoCliente(pedido);
  const total = pedido.valorTotal ? Number(pedido.valorTotal) : 0;
  const final = Math.round((total - Math.round((total / 2) * 100) / 100) * 100) / 100;
  await enviar({
    to,
    assunto: '🐝 Produção concluída — falta o pagamento final',
    titulo: 'Seu model está pronto!',
    paragrafos: [
      'A produção do seu model foi concluída. 🎉',
      `Para receber os arquivos, falta o pagamento da <strong>parcela final (50%)${
        total ? `: R$ ${final.toFixed(2).replace('.', ',')}` : ''
      }</strong>. Acesse o pedido para pagar via Pix.`,
    ],
    cta: { href: linkPedido(pedido), texto: 'Pagar a parcela final' },
  });
}

export async function notificarClienteConcluido(pedido) {
  const to = await emailDoCliente(pedido);
  await enviar({
    to,
    assunto: '🐝 Pagamento final confirmado — pedido finalizado!',
    titulo: 'Pedido concluído',
    paragrafos: [
      'Pagamento confirmado e seu model está prontinho! Obrigado por encomendar com a gente. 🐝',
      'O artista vai entrar em contato para a entrega dos arquivos.',
    ],
    cta: { href: linkPedido(pedido), texto: 'Ver pedido' },
  });
}

// =================== NOTIFICAÇÕES DO ARTISTA ===================

export async function notificarArtistaNovoPedido(pedido, clienteNome) {
  const to = await emailsDoArtista();
  await enviar({
    to,
    assunto: '🐝 Novo pedido recebido',
    titulo: 'Chegou um pedido novo',
    paragrafos: [
      `<strong>${clienteNome || 'Um cliente'}</strong> acabou de enviar um pedido de ${
        pedido.tipo === 'model' ? 'model' : 'item avulso'
      }.`,
      'Acesse o painel para revisar e orçar.',
    ],
    cta: { href: `${BASE}/admin`, texto: 'Abrir painel' },
  });
}

export async function notificarArtistaPagamento(pedido, clienteNome) {
  const to = await emailsDoArtista();
  await enviar({
    to,
    assunto: '🐝 Pagamento confirmado — pedido na fila',
    titulo: 'Um pedido foi pago',
    paragrafos: [
      `O pedido de <strong>${clienteNome || 'um cliente'}</strong> foi pago e entrou na fila de produção.`,
    ],
    cta: { href: `${BASE}/admin`, texto: 'Abrir painel' },
  });
}

export async function notificarArtistaPedidoAceito(pedido) {
  const to = await emailsDoArtista();
  await enviar({
    to,
    assunto: '🐝 Orçamento aceito — confirme o pagamento',
    titulo: 'Um orçamento foi aceito',
    paragrafos: [
      `O pedido de <strong>${pedido.cliente?.nome || 'um cliente'}</strong> foi aceito.`,
      'O cliente vai pagar a entrada e enviar o comprovante no ticket do Discord. Quando o valor cair na conta, confirme o pagamento no painel para o pedido entrar na fila de produção.',
    ],
    cta: { href: `${BASE}/admin`, texto: 'Abrir painel' },
  });
}

export async function notificarArtistaMarcouPago(pedido, clienteNome) {
  const to = await emailsDoArtista();
  await enviar({
    to,
    assunto: '🐝 Cliente informou um pagamento Pix — confira',
    titulo: 'Pagamento informado (Pix)',
    paragrafos: [
      `<strong>${clienteNome || 'Um cliente'}</strong> informou que fez o Pix de um pedido.`,
      'Confira na conta se o valor caiu e, se sim, confirme o pagamento no painel para o pedido entrar na fila.',
    ],
    cta: { href: `${BASE}/admin`, texto: 'Abrir painel' },
  });
}

export async function notificarArtistaCancelamento(pedido, clienteNome) {
  const to = await emailsDoArtista();
  await enviar({
    to,
    assunto: '🐝 Um pedido foi cancelado',
    titulo: 'Pedido cancelado pelo cliente',
    paragrafos: [
      `<strong>${clienteNome || 'Um cliente'}</strong> cancelou um pedido que ainda não havia sido pago.`,
    ],
    cta: { href: `${BASE}/admin`, texto: 'Abrir painel' },
  });
}

// Notificação de recuperação de senha (link com token).
export async function notificarResetSenha(email, link) {
  await enviar({
    to: email,
    assunto: '🐝 Redefinição de senha',
    titulo: 'Redefinir sua senha',
    paragrafos: [
      'Recebemos um pedido para redefinir a senha da sua conta.',
      'O link abaixo expira em 1 hora. Se não foi você, ignore este e-mail.',
    ],
    cta: { href: link, texto: 'Redefinir senha' },
  });
}
