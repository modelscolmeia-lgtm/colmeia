import Layout from '../components/Layout';
import BotaoDiscord from '../components/BotaoDiscord';

export default function Login() {
  return (
    <Layout>
      <div className="auth-container">
        <h1>Entrar no Colmeia</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Entre com a sua conta do <strong>Discord</strong> — é rapidinho, e todo o atendimento do
          seu pedido (orçamento, pagamento e produção) acontece por lá.
        </p>
        <BotaoDiscord texto="Entrar com Discord" />
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          Ao entrar pela primeira vez, sua conta é criada automaticamente. Não precisa de senha. 🐝
        </p>
      </div>
    </Layout>
  );
}
