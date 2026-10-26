// Cabeçalho padrão das páginas: título, enfeite, subtítulo e botões de ação à direita.
export default function Cabecalho({ titulo, subtitulo, children }) {
  return (
    <header className="cabecalho">
      <div className="cabecalho-texto">
        <h1>{titulo}</h1>
        <div className="ornamento" aria-hidden="true"><i /></div>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {children && <div className="cabecalho-acoes">{children}</div>}
    </header>
  );
}
