import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const PASSOS = [
  { t: 'Monte seu model', d: 'Escolha skin, cabelo, chifres, asas e tudo mais. Crie quantas versões quiser.' },
  { t: 'Receba o orçamento', d: 'O artista revisa o pedido, ajusta o que for preciso e envia o valor.' },
  { t: 'Pague com Pix', d: 'Aceitou? Você paga a entrada via Pix e combina o resto no ticket do Discord.' },
  { t: 'Acompanhe a fila', d: 'Veja sua posição na fila e o prazo de entrega (20 a 45 dias).' },
];

export default function Home() {
  const { usuario } = useAuth();

  return (
    <Layout>
      <section className="hero">
        <h1><img src="/logo-colmeia.webp" alt="Colmeia" className="hero-logo" width="1200" height="600" fetchpriority="high" /></h1>
        <p className="lead">
          Encomende seu <strong>Minecraft custom model</strong> do jeitinho que você imaginou,
          monte cada detalhe do personagem e acompanhe a produção do começo ao fim.
        </p>
        <div className="btn-row center-row">
          {usuario ? (
            <Link to="/montar"><button className="cta">Fazer um pedido</button></Link>
          ) : (
            <Link to="/login"><button className="cta">Entrar com Discord e fazer pedido</button></Link>
          )}
          <Link to="/portfolio"><button className="secundario cta">Ver portfólio</button></Link>
        </div>
      </section>

      <h2 className="center">Como funciona</h2>
      <div className="passos-grid">
        {PASSOS.map((p, i) => (
          <div className="passo" key={i}>
            <div className="num">{i + 1}</div>
            <h3 style={{ margin: '0 0 6px' }}>{p.t}</h3>
            <p className="muted" style={{ margin: 0 }}>{p.d}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
