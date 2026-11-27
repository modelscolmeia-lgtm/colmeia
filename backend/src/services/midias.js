// Reconhece os links escritos num anúncio (TikTok, YouTube, Instagram, Vimeo, imagem, vídeo ou outro)
// para o site mostrar o vídeo/imagem junto do texto.

const MAXIMO = 5; // o Discord também só gera prévia dos 5 primeiros links

export function extrairLinks(texto) {
  const achados = String(texto || '').match(/https?:\/\/[^\s<>"']+/gi) || [];
  const limpos = achados.map((u) => u.replace(/[.,!?;:)\]}]+$/, '')); // pontuação colada no fim da frase
  return [...new Set(limpos)].slice(0, MAXIMO);
}

function classificar(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return { url, tipo: 'link' };
  }
  const host = u.hostname.toLowerCase().replace(/^(www|m)\./, '');
  const partes = u.pathname.split('/').filter(Boolean);

  if (host === 'youtube.com' || host === 'youtu.be') {
    const curto = partes[0] === 'shorts';
    const id = host === 'youtu.be' ? partes[0]
      : ['shorts', 'embed', 'live'].includes(partes[0]) ? partes[1]
        : u.searchParams.get('v');
    if (/^[\w-]{11}$/.test(id || '')) return { url, tipo: 'youtube', ref: id, vertical: curto };
  }
  if (host === 'tiktok.com') {
    const i = partes.indexOf('video');
    if (i >= 0 && /^\d{8,25}$/.test(partes[i + 1] || '')) return { url, tipo: 'tiktok', ref: partes[i + 1], vertical: true };
  }
  if (host === 'instagram.com' && ['p', 'reel', 'tv'].includes(partes[0]) && /^[\w-]+$/.test(partes[1] || '')) {
    return { url, tipo: 'instagram', ref: `${partes[0]}/${partes[1]}`, vertical: true };
  }
  if (host === 'vimeo.com' && /^\d+$/.test(partes[0] || '')) return { url, tipo: 'vimeo', ref: partes[0] };
  if (u.protocol === 'https:' && /\.(png|jpe?g|gif|webp|avif)$/i.test(u.pathname)) return { url, tipo: 'imagem' };
  if (u.protocol === 'https:' && /\.(mp4|webm|mov)$/i.test(u.pathname)) return { url, tipo: 'video' };
  return { url, tipo: 'link' };
}

const ehLinkCurtoTikTok = (url) => /^https?:\/\/((vm|vt)\.tiktok\.com\/|(www\.)?tiktok\.com\/t\/)/i.test(url);

// Link de compartilhamento do TikTok (vm.tiktok.com/...) não traz o número do vídeo: segue o
// redirecionamento para descobrir. Só consulta endereços do próprio TikTok.
async function resolverTikTok(url) {
  let atual = url;
  for (let passo = 0; passo < 3; passo++) {
    const r = await fetch(atual, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
    const destino = r.headers.get('location');
    if (!destino) break;
    const proximo = new URL(destino, atual);
    if (!/(^|\.)tiktok\.com$/i.test(proximo.hostname)) break;
    atual = proximo.href;
    if (classificar(atual).tipo === 'tiktok') break;
  }
  return atual;
}

export async function lerMidias(texto) {
  return Promise.all(
    extrairLinks(texto).map(async (url) => {
      if (!ehLinkCurtoTikTok(url)) return classificar(url);
      try {
        return { ...classificar(await resolverTikTok(url)), url };
      } catch (e) {
        console.error('Link do TikTok não pôde ser lido:', e.message);
        return { url, tipo: 'link' };
      }
    })
  );
}
