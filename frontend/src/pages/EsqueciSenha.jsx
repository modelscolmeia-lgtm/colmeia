import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../services/api';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await api.post('/auth/esqueci-senha', { email });
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Layout>
      <div className="auth-container">
        <h1>Recuperar senha</h1>
        {enviado ? (
          <>
            <p className="ok">Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.</p>
            <p className="muted" style={{ fontSize: 15 }}>Confira sua caixa de entrada (e o spam). O link expira em 1 hora.</p>
            <p><Link to="/login">Voltar para o login</Link></p>
          </>
        ) : (
          <>
            <p className="muted" style={{ fontSize: 16 }}>Informe seu e-mail que enviamos um link para criar uma nova senha.</p>
            <form onSubmit={handleSubmit}>
              <label>
                Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              {erro && <p className="erro">{erro}</p>}
              <button type="submit" disabled={carregando}>{carregando ? 'Enviando...' : 'Enviar link'}</button>
            </form>
            <p><Link to="/login">Voltar para o login</Link></p>
          </>
        )}
      </div>
    </Layout>
  );
}
