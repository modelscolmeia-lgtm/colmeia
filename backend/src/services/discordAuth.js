/**
 * Login/cadastro via Discord (OAuth2).
 *
 * Config (.env) — vêm da MESMA aplicação do bot no Discord Developer Portal:
 *   DISCORD_CLIENT_ID       -> Client ID da aplicação
 *   DISCORD_CLIENT_SECRET   -> Client Secret
 *   DISCORD_REDIRECT_URI    -> URL de callback (registrada no portal)
 *                              ex: http://localhost:4000/api/auth/discord/callback
 *   DISCORD_ADMIN_IDS       -> IDs de Discord dos artistas (viram admin), separados por vírgula
 *
 * Sem CLIENT_ID/SECRET, o login por Discord fica desativado (o login por e-mail continua).
 */
const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, DISCORD_ADMIN_IDS } =
  process.env;

export const DISCORD_AUTH_ATIVO = !!(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET);

const REDIRECT = DISCORD_REDIRECT_URI || 'http://localhost:4000/api/auth/discord/callback';
const ADMIN_IDS = (DISCORD_ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);

// O ID do Discord está na lista de admins?
export function ehAdminDiscord(id) {
  return ADMIN_IDS.includes(String(id));
}

// URL para onde o navegador é enviado para autorizar.
export function urlAutorizacao(state) {
  const p = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: 'identify email',
    state,
  });
  return `https://discord.com/oauth2/authorize?${p.toString()}`;
}

// Troca o "code" pelo perfil do usuário no Discord.
export async function trocarCodigo(code) {
  const body = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT,
  });
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tok = await tokenRes.json().catch(() => ({}));
  if (!tok.access_token) throw new Error('Falha ao autenticar no Discord');

  const perfil = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  }).then((r) => r.json());

  return {
    id: perfil.id,
    username: perfil.global_name || perfil.username,
    email: perfil.email || null,
    avatar: perfil.avatar
      ? `https://cdn.discordapp.com/avatars/${perfil.id}/${perfil.avatar}.png`
      : null,
  };
}
