import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import trabalhos from '../data/portfolio.json';

const PASSOS = [
  { t: 'Monte seu model', d: 'Escolha skin, cabelo, chifres, asas e tudo mais. Crie quantas versões quiser.' },
  { t: 'Receba o orçamento', d: 'O artista revisa o pedido, ajusta o que for preciso e envia o valor.' },
  { t: 'Pague com Pix', d: 'Aceitou? Você paga a entrada via Pix e combina o resto no ticket do Discord.' },
  { t: 'Acompanhe a fila', d: 'Veja sua posição na fila e o prazo de entrega (20 a 45 dias).' },
];

export default function Home() {
  const { usuario } = useAuth();
  const destaques = trabalhos.slice(0, 4);

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
          <Link to="/portfolio" key={t.imagem} className="portfolio-card" aria-label={t.titulo}>
            <img src={t.imagem} alt="" width="1080" height="1080" loading="lazy" decoding="async" style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1 / 1', objectFit: 'cover' }} />
          </Link>
        ))}
      </div>
    </Layout>
  );
}
