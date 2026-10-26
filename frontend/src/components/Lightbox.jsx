import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icone from './Icone';

// Imagem ampliada em tela cheia. Vai para o <body> (portal) para sempre cobrir a janela:
// dentro de elementos com filter/transform/clip-path, "position: fixed" deixa de ser da janela.
export default function Lightbox({ src, alt = '', onFechar }) {
  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && onFechar();
    document.addEventListener('keydown', aoTeclar);
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // a página de trás não rola enquanto a imagem está aberta
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAntes;
    };
  }, [onFechar]);

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt || 'Imagem ampliada'} onClick={onFechar}>
      <img src={src} alt={alt} />
      <button className="lightbox-fechar" onClick={onFechar} aria-label="Fechar">
        <Icone nome="fechar" />
      </button>
    </div>,
    document.body
  );
}
