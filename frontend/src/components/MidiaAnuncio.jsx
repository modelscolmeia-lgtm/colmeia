// Mostra o que há num link do anúncio: vídeo (TikTok, YouTube, Instagram, Vimeo ou arquivo), imagem ou,
// para outros sites, o link para abrir.
const PLAYERS = {
  youtube: (m) => `https://www.youtube-nocookie.com/embed/${m.ref}`,
  // player só com o vídeo (o "embed" completo deixava uma sobra branca embaixo)
  tiktok: (m) => `https://www.tiktok.com/player/v1/${m.ref}`,
  instagram: (m) => `https://www.instagram.com/${m.ref}/embed`,
  vimeo: (m) => `https://player.vimeo.com/video/${m.ref}`,
};
const NOMES = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', vimeo: 'Vimeo' };

export default function MidiaAnuncio({ midia, onAmpliar }) {
  const player = PLAYERS[midia.tipo];
  if (player && midia.ref) {
    return (
      <div className={'midia-quadro ' + midia.tipo + (midia.vertical ? ' vertical' : '')}>
        <iframe
          src={player(midia)}
          title={`Vídeo do ${NOMES[midia.tipo]}`}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }
  if (midia.tipo === 'imagem') {
    return (
      <button type="button" className="anuncio-img" onClick={() => onAmpliar(midia.url)} aria-label="Ampliar a imagem">
        <img src={midia.url} alt="" loading="lazy" decoding="async" />
      </button>
    );
  }
  if (midia.tipo === 'video') {
    return <video className="midia-video" src={midia.url} controls preload="metadata" playsInline />;
  }
  return (
    <a className="midia-link" href={midia.url} target="_blank" rel="noopener noreferrer">
      Abrir link: {midia.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}
    </a>
  );
}

// O texto do anúncio com os links clicáveis.
export function TextoComLinks({ texto }) {
  const partes = String(texto || '').split(/(https?:\/\/[^\s<>"']+)/gi);
  return partes.map((p, i) =>
    i % 2 ? (
      <a key={i} href={p.replace(/[.,!?;:)\]}]+$/, '')} target="_blank" rel="noopener noreferrer">{p}</a>
    ) : (
      p
    )
  );
}
