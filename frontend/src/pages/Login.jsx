import { useSearchParams } from 'react-router-dom';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import BotaoDiscord from '../components/BotaoDiscord';

export default function Login() {
  const [params] = useSearchParams();
  const erro = params.get('erro');

  return (
    <Layout>
      <div className="auth-container">
        <h1>Entrar no Colmeia</h1>

        {erro && (
          <div className="aviso" style={{ marginBottom: 14 }}>
            <Icone nome="aviso" /> <strong>Não foi possível entrar.</strong>
            <div style={{ marginTop: 4 }}>
              {erro === 'discord' ? 'O login pelo Discord foi cancelado ou expirou.' : erro}
            </div>
            <div className="muted" style={{ fontSize: 16, marginTop: 6 }}>
              Espere um pouquinho antes de tentar de novo — clicar várias vezes seguidas costuma
              piorar.
            </div>
          </div>
        )}

        <p className="muted" style={{ marginTop: 0 }}>
          Entre com a sua conta do <strong>Discord</strong> — é rapidinho, e todo o atendimento do
          seu pedido (orçamento, pagamento e produção) acontece por lá.
        </p>
        <BotaoDiscord texto="Entrar com Discord" />
        <p className="muted" style={{ fontSize: 16, marginTop: 12 }}>
          Ao entrar pela primeira vez, sua conta é criada automaticamente. Não precisa de senha.
        </p>
      </div>
    </Layout>
  );
}
