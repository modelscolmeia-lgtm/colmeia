import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import BotaoDiscord from '../components/BotaoDiscord';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { cadastrar } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await cadastrar(nome, email, senha);
      navigate('/montar');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Layout>
    <div className="auth-container">
      <h1>Criar conta no Colmeia</h1>

      <BotaoDiscord texto="Criar conta com Discord" />

      <div className="row" style={{ margin: '16px 0 8px' }}>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
        <span className="muted" style={{ fontSize: 13 }}>ou com e-mail</span>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          Nome
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" className="secundario" disabled={carregando}>
          {carregando ? 'Criando...' : 'Criar conta com e-mail'}
        </button>
      </form>
      <p>Já tem conta? <Link to="/login">Entrar</Link></p>
    </div>
    </Layout>
  );
}
