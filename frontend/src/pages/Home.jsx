import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { imagemUrl } from '../utils/pedido';
import fixos from '../data/portfolio.json';

const PASSOS = [
  { t: 'Monte seu model', d: 'Escolha skin, cabelo, chifres, asas e tudo mais. Crie quantas versões quiser.' },
  { t: 'Receba o orçamento', d: 'O artista revisa o pedido, ajusta o que for preciso e envia o valor.' },
  { t: 'Pague com Pix', d: 'Aceitou? Você paga a entrada via Pix e combina o resto no ticket do Discord.' },
  { t: 'Acompanhe a fila', d: 'Veja sua posição na fila e o prazo de entrega (20 a 45 dias).' },
];

const TROCA_DIAS = 3;
const QUANTOS = 4;

// Sorteio que só muda a cada TROCA_DIAS dias: o mesmo período dá sempre os mesmos trabalhos,
// então a Home não muda a cada visita, mas se renova sozinha de tempos em tempos.
function sortearDoPeriodo(lista) {
  let x = Math.floor(Date.now() / (TROCA_DIAS * 86400000)) + 1;
  const aleatorio = () => {
    x = (x + 0x6d2b79f5) | 0;
    let t = Math.imul(x ^ (x >>> 15), 1 | x);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, QUANTOS);
}

export default function Home() {
  const { usuario } = useAuth();
  const [destaques, setDestaques] = useState([]);

  // Mesmo portfólio da página /portfolio (adicionados pelo artista + fixos que não foram escondidos)
  useEffect(() => {
    Promise.all([api.get('/portfolio').catch(() => []), api.get('/portfolio/ocultos').catch(() => [])]).then(([novos, ocultos]) => {
      const todos = [
        ...novos.map((n) => ({ chave: n._id, titulo: n.titulo, src: imagemUrl(n.imagem) })),
        ...fixos.filter((f) => !ocultos.includes(f.imagem)).map((f) => ({ chave: f.imagem, titulo: f.titulo, src: f.imagem })),
      ];
      setDestaques(sortearDoPeriodo(todos));
    });
  }, []);

  return (
    <Layout>
      <section className="hero">
        <div>
          <span className="sobrelinha">Minecraft custom models</span>
          <h1>Seu personagem, feito sob medida</h1>
          <p className="lead">
            Monte cada detalhe do seu model, receba o orçamento do artista e acompanhe a produção
            do começo ao fim.
          </p>
          <div className="btn-row">
            {usuario ? (
              <Link to="/montar"><button className="cta">Fazer um pedido</button></Link>
            ) : (
              <Link to="/login"><button className="cta">Entrar com Discord e pedir</button></Link>
            )}
            <Link to="/portfolio"><button className="secundario cta">Ver portfólio</button></Link>
          </div>
        </div>
        <img src="/hero-escritorio.webp" alt="" className="hero-arte" width="960" height="706" fetchPriority="high" />
      </section>

      <div className="secao-titulo">
        <h2>Como funciona</h2>
      </div>
      <div className="passos-grid">
        {PASSOS.map((p, i) => (
          <div className="passo" key={i}>
            <div className="num">{i + 1}</div>
            <h3>{p.t}</h3>
            <p>{p.d}</p>
          </div>
        ))}
      </div>

      <div className="secao-titulo">
        <h2>Alguns trabalhos</h2>
        <Link to="/portfolio">Ver portfólio</Link>
      </div>
      <div className="home-portfolio">
        {destaques.map((t) => (
          <Link to="/portfolio" key={t.chave} className="portfolio-card" aria-label={t.titulo}>
            <span className="portfolio-img" style={{ display: 'block', '--fundo': `url("${t.src}")` }}>
              <img src={t.src} alt="" width="1080" height="1080" loading="lazy" decoding="async" />
            </span>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
