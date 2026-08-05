import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

// Recebe o token vindo do callback do Discord, faz login e redireciona.
export default function EntrarDiscord() {
  const [params] = useSearchParams();
  const { completarLoginDiscord } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState('');
  const jaRodou = useRef(false);

  useEffect(() => {
    if (jaRodou.current) return;
    jaRodou.current = true;
    const token = params.get('token');
    if (!token) {
      setErro('Login pelo Discord falhou. Tente de novo.');
      return;
    }
    completarLoginDiscord(token)
      .then((usuario) => navigate(usuario.role === 'admin' ? '/admin' : '/', { replace: true }))
      .catch((e) => setErro(e.message));
  }, [params, completarLoginDiscord, navigate]);

  return (
    <Layout>
      <div className="auth-container">
        {erro ? <p className="erro">{erro}</p> : <p className="muted">Entrando com o Discord...</p>}
      </div>
    </Layout>
  );
}
