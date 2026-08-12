import { useState } from 'react';

function temaAtual() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

// Ícones sol/lua (monocromáticos, herdam a cor do botão).
function Sol() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
      <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M19.4 4.6l-1.7 1.7M6.3 17.7l-1.7 1.7" />
    </svg>
  );
}
function Lua() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

// Botão flutuante (fixo, perto da barra de scroll) que alterna o tema.
export default function ThemeToggle() {
  const [tema, setTema] = useState(temaAtual);

  function alternar() {
    const novo = tema === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', novo);
    localStorage.setItem('colmeia_tema', novo);
    setTema(novo);
  }

  return (
    <button
      className="tema-toggle"
      onClick={alternar}
      title={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label="Alternar tema"
    >
      {tema === 'dark' ? <Sol /> : <Lua />}
    </button>
  );
}
