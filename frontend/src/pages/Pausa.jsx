import Layout from '../components/Layout';
import EstadoVazio from '../components/EstadoVazio';
import { useSite } from '../context/SiteContext';
import { DISCORD_CONVITE } from '../utils/pedido';

// Tela que os clientes veem quando o artista pausa o site.
export default function Pausa() {
  const { mensagem } = useSite();

  return (
    <Layout largura="container-narrow">
      <div style={{ marginTop: 32 }}>
        <EstadoVazio titulo="Estamos em pausa" texto={mensagem || 'O site está fechado por enquanto. Voltamos em breve!'} />
        {DISCORD_CONVITE && (
          <p className="center" style={{ marginTop: 18 }}>
            <a href={DISCORD_CONVITE} target="_blank" rel="noopener noreferrer">
              <button>Entrar no Discord</button>
            </a>
          </p>
        )}
      </div>
    </Layout>
  );
}
