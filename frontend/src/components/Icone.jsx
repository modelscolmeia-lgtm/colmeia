// Ícones de traço fino (24x24). Usam currentColor e herdam o tamanho da fonte do texto.
// Decorativos por padrão (aria-hidden); passe `titulo` para dar nome acessível.
const CAMINHOS = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  fechar: 'M6 6l12 12M18 6L6 18',
  aviso: 'M12 3.5l9.5 16.5h-19L12 3.5z M12 10v4 M12 17h.01',
  balao: 'M4 5h16v11H9l-5 4V5z',
  moeda: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 7v10 M9.5 10.5h4a1.5 1.5 0 010 3h-4',
  raio: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  documento: 'M7 3h7l5 5v13H7V3z M14 3v5h5 M10 13h6 M10 17h6',
  ampulheta: 'M6 3h12 M6 21h12 M7 3v3.5L12 12 7 17.5V21 M17 3v3.5L12 12l5 5.5V21',
  menu: 'M4 7h16M4 12h16M4 17h16',
  casa: 'M3.5 11L12 4l8.5 7 M6 10v10h12V10 M10 20v-6h4v6',
  portfolio: 'M4 5h16v14H4z M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M4 17l5-5 4 4 3-3 4 4',
  pedido: 'M5 8h14l-1 12H6L5 8z M9 8V6a3 3 0 016 0v2',
  lista: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  fila: 'M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20 M10 12a3 3 0 100-6 3 3 0 000 6z M20 20v-1.5a3.5 3.5 0 00-2.5-3.3 M15.5 6.2a3 3 0 010 5.6',
  painel: 'M4 4h7v8H4z M13 4h7v5h-7z M13 11h7v9h-7z M4 14h7v6H4z',
  catalogo: 'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3V4z M5 17a3 3 0 013-3h11',
  cupom: 'M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V8z M14 6v12',
  sair: 'M10 4H5v16h5 M15 8l4 4-4 4 M19 12H9',
  anuncio: 'M3 10v4h3l8 4V6L6 10H3z M18 9a4 4 0 010 6 M7 14l1.5 6h2.5l-1-5',
  fixar: 'M9 4h6l-1 6 3 3H7l3-3-1-6z M12 13v7',
  estrela: 'M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3z',
};

export default function Icone({ nome, tamanho, titulo, className }) {
  const d = CAMINHOS[nome];
  if (!d) return null;
  const medida = tamanho ? { width: tamanho, height: tamanho } : undefined;
  return (
    <svg
      className={'icone ' + (className || '')}
      viewBox="0 0 24 24"
      {...medida}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <path d={d} />
    </svg>
  );
}
