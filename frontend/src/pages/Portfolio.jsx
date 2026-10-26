import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Icone from '../components/Icone';
import { useAuth } from '../context/AuthContext';
import trabalhos from '../data/portfolio.json';

// Quantos hexágonos cabem na linha larga (a linha seguinte tem um a menos, como num favo).
// Os mesmos limites estão no CSS (--hw por largura de tela).
function usePorLinha() {
  const calc = () => {
    const w = window.innerWidth;
    return w >= 1160 ? 5 : w >= 860 ? 4 : w >= 600 ? 3 : 2;
  };
  const [n, setN] = useState(calc);
  useEffect(() => {
    const aoRedimensionar = () => setN(calc());
    window.addEventListener('resize', aoRedimensionar);
    return () => window.removeEventListener('resize', aoRedimensionar);
  }, []);
  return n;
}

function emLinhas(itens, n) {
  const linhas = [];
  let i = 0;
  let larga = true;
  while (i < itens.length) {
    const tam = larga ? n : n - 1;
    linhas.push(itens.slice(i, i + tam));
    i += tam;
    larga = !larga;
  }
  return linhas;
}

// "Modelo da Operária Dyst" -> "Operária Dyst" (cabe melhor dentro do hexágono)
const tituloCurto = (t) => t.replace(/^Modelo\s+(d[aeo]s?\s+)?/i, '');

// Galeria dos models já feitos pelo artista: favo de hexágonos + imagem ampliada ao clicar.
export default function Portfolio() {
  const { usuario } = useAuth();
  const [paginas, setPaginas] = useState(1);
  const [aberto, setAberto] = useState(null); // índice do trabalho ampliado
  const porLinha = usePorLinha();
  // cada "página" fecha linhas completas do favo (ex.: 4+3+4+3), sem hexágono sozinho no fim
  const porPagina = (2 * porLinha - 1) * 2;
  const visiveis = Math.min(trabalhos.length, paginas * porPagina);

  // Esc fecha a imagem ampliada; setas trocam de trabalho.
  useEffect(() => {
    if (aberto == null) return undefined;
    const aoTeclar = (e) => {
      if (e.key === 'Escape') setAberto(null);
      if (e.key === 'ArrowRight') setAberto((i) => Math.min(trabalhos.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setAberto((i) => Math.max(0, i - 1));
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  const mostrados = trabalhos.slice(0, visiveis).map((t, i) => ({ ...t, i }));

  return (
    <Layout>
      <h1>Portfólio</h1>
      <p className="muted">
        Alguns dos models que o artista já fez. Clique num hexágono para ver em tamanho grande.
      </p>

      <div className="hex-favo">
        {emLinhas(mostrados, porLinha).map((linha, li) => (
          <div className="hex-linha" key={li}>
            {linha.map((t) => (
              <button
                type="button"
                key={t.imagem}
                className="hex-port"
                onClick={() => setAberto(t.i)}
                aria-label={`Ampliar: ${t.titulo}`}
              >
                <span className="hex-borda">
                  <span className="hex-miolo">
                    <img src={t.imagem} alt="" width="1080" height="1080" loading="lazy" decoding="async" />
                    <span className="hex-titulo">{tituloCurto(t.titulo)}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="center" style={{ marginTop: 26 }}>
        {visiveis < trabalhos.length && (
          <button className="secundario" onClick={() => setPaginas((p) => p + 1)}>
            Mostrar mais ({trabalhos.length - visiveis} restantes)
          </button>
        )}
      </div>

      <div className="portfolio-cta">
        <strong>Gostou? Peça o seu.</strong>
        <Link to={usuario ? '/montar' : '/login'}>
          <button className="cta">{usuario ? 'Fazer um pedido' : 'Entrar com Discord e pedir'}</button>
        </Link>
      </div>

      {aberto != null && trabalhos[aberto] && (
        <div className="lightbox portfolio-lightbox" role="dialog" aria-label={trabalhos[aberto].titulo} onClick={() => setAberto(null)}>
          <img src={trabalhos[aberto].imagem} alt={trabalhos[aberto].titulo} />
          <p className="lightbox-legenda">{trabalhos[aberto].titulo} · {aberto + 1} de {trabalhos.length}</p>
          <button className="lightbox-fechar" onClick={() => setAberto(null)} aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </div>
      )}
    </Layout>
  );
}
