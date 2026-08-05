import Layout from '../components/Layout';
import BotaoDiscord from '../components/BotaoDiscord';

export default function Cadastro() {
  return (
    <Layout>
      <div className="auth-container">
        <h1>Criar conta no Colmeia</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          É só entrar com o <strong>Discord</strong> — a sua conta é criada na hora, sem senha. E o
          atendimento do seu pedido acontece direto por lá.
        </p>
        <BotaoDiscord texto="Criar conta com Discord" />
      </div>
    </Layout>
  );
}
