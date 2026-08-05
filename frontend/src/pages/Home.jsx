import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const PASSOS = [
  { t: 'Monte seu model', d: 'Escolha skin, cabelo, chifres, asas e tudo mais. Crie quantas versões quiser.' },
  { t: 'Receba o orçamento', d: 'O artista revisa o pedido, ajusta o que for preciso e envia o valor.' },
  { t: 'Pague com Pix', d: 'Aceitou? É só pagar via Pix pelo Mercado Pago, rapidinho.' },
  { t: 'Acompanhe a fila', d: 'Veja sua posição na fila e o prazo de entrega (20 a 45 dias).' },
];

export default function Home() {
  const { usuario } = useAuth();

  return (
    <Layout>
      <section className="hero">
        <h1>🐝 Colmeia</h1>
        <p className="lead">
          Encomende seu <strong>Minecraft custom model</strong> do jeitinho que você imaginou —
          monte cada detalhe do personagem e acompanhe a produção do começo ao fim.
        </p>
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          {usuario ? (
            <Link to="/montar"><button>Fazer um pedido</button></Link>
          ) : (
            <>
              <Link to="/cadastro"><button>Começar agora</button></Link>
              <Link to="/login"><button className="secundario">Já tenho conta</button></Link>
            </>
          )}
        </div>
      </section>

      <h2 className="center">Como funciona</h2>
      <div className="passos-grid" style={{ marginTop: 16 }}>
        {PASSOS.map((p, i) => (
          <div className="passo" key={i}>
            <div className="num">{i + 1}</div>
            <h3 style={{ margin: '0 0 6px' }}>{p.t}</h3>
            <p className="muted" style={{ margin: 0 }}>{p.d}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 32 }}>
        <h3 style={{ marginTop: 0 }}>O que dá pra personalizar?</h3>
        <p className="muted">
          Skin, cabelo, chifres, orelhas, expressões, rabos, caudas, asas, roupas 3D, armaduras,
          acessórios e pets voadores. Também dá pra encomendar itens avulsos como espadas, cajados
          e escudos — ou descrever algo totalmente seu.
        </p>
      </div>
    </Layout>
  );
}
