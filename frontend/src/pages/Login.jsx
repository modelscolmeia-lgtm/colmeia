import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import BotaoDiscord from '../components/BotaoDiscord';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const usuario = await login(email, senha);
      navigate(usuario.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Layout>
    <div className="auth-container">
      <h1>Entrar no Colmeia</h1>

      <BotaoDiscord texto="Entrar com Discord" />

      <div className="row" style={{ margin: '16px 0 8px' }}>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
        <span className="muted" style={{ fontSize: 13 }}>ou com e-mail</span>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" className="secundario" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar com e-mail'}
        </button>
      </form>
      <p style={{ marginBottom: 4 }}><Link to="/esqueci-senha">Esqueci minha senha</Link></p>
      <p>Não tem conta? <Link to="/cadastro">Cadastre-se</Link></p>
    </div>
    </Layout>
  );
}
