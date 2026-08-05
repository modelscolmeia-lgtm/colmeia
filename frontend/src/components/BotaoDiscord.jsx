import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Botão "Entrar com Discord" — só aparece se o login por Discord estiver configurado no backend.
export default function BotaoDiscord({ texto = 'Entrar com Discord' }) {
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    fetch(`${API}/config`)
      .then((r) => r.json())
      .then((c) => setAtivo(!!c.discordAuth))
      .catch(() => {});
  }, []);

  if (!ativo) return null;

  return (
    <button
      type="button"
      onClick={() => { window.location.href = `${API}/auth/discord`; }}
      style={{ background: '#5865f2', color: '#fff', width: '100%' }}
    >
      💬 {texto}
    </button>
  );
}
