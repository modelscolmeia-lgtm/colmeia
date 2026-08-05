import { useState } from 'react';

function temaAtual() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

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
      className="link tema-toggle"
      onClick={alternar}
      title={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label="Alternar tema"
    >
      {tema === 'dark' ? '☀ Claro' : '☾ Escuro'}
    </button>
  );
}
