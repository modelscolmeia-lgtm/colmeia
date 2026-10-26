import { useState } from 'react';
import Icone from './Icone';

function temaAtual() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

// Interruptor pixel claro/escuro: o bloco de mel desliza para o lado do sol ou da lua.
export default function ThemeToggle({ className = '' }) {
  const [tema, setTema] = useState(temaAtual);
  const escuro = tema === 'dark';

  function alternar() {
    const novo = escuro ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', novo);
    try {
      localStorage.setItem('colmeia_tema', novo);
    } catch {
      /* sem armazenamento: o tema vale só nesta visita */
    }
    setTema(novo);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={escuro}
      aria-label="Tema escuro"
      title={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      className={'tema-switch ' + (escuro ? 'escuro' : 'claro') + ' ' + className}
      onClick={alternar}
    >
      <span className="tema-lado" aria-hidden="true"><Icone nome="sol" tamanho={18} /></span>
      <span className="tema-lado" aria-hidden="true"><Icone nome="lua" tamanho={18} /></span>
      <span className="tema-bloco" aria-hidden="true">
        <Icone nome={escuro ? 'lua' : 'sol'} tamanho={18} />
      </span>
    </button>
  );
}
