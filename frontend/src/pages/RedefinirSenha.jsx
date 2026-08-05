import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../services/api';

export default function RedefinirSenha() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    if (senha !== confirma) return setErro('As senhas não conferem.');
    if (senha.length < 6) return setErro('A senha precisa ter ao menos 6 caracteres.');
    setCarregando(true);
    try {
      await api.post('/auth/redefinir-senha', { token, senha });
      setOk(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Layout>
      <div className="auth-container">
        <h1>Nova senha</h1>
        {ok ? (
          <>
            <p className="ok">Senha redefinida com sucesso! Redirecionando para o login...</p>
            <p><Link to="/login">Ir para o login</Link></p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Nova senha
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
            </label>
            <label>
              Confirmar nova senha
              <input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} required minLength={6} />
            </label>
            {erro && <p className="erro">{erro}</p>}
            <button type="submit" disabled={carregando}>{carregando ? 'Salvando...' : 'Redefinir senha'}</button>
          </form>
        )}
      </div>
    </Layout>
  );
}
