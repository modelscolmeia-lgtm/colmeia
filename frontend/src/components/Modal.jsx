import { useEffect } from 'react';

// Modal pixelado, sobreposto à página. Fecha no ESC, no X ou clicando no fundo.
export default function Modal({ aberto, titulo, children, onFechar, footer }) {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e) => e.key === 'Escape' && onFechar?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button className="modal-close" onClick={onFechar} aria-label="Fechar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
