import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { statusLabel, janelaPrazo, normaliza } from '../utils/pedido';

export default function Fila() {
  const { token, usuario } = useAuth();
  const ehAdmin = usuario?.role === 'admin';
  const [fila, setFila] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    api
      .get('/fila', token)
      .then(setFila)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [token]);

  return (
    <Layout>
      <h1>Fila de produção</h1>
      <p className="muted">
        A produção é feita um pedido por vez. O prazo (20 a 45 dias) começa a contar quando o
        pedido entra em produção.
      </p>

      {ehAdmin && fila.length > 0 && (
        <>
          <p className="muted" style={{ marginBottom: 8 }}>
            <strong>{fila.length}</strong> {fila.length === 1 ? 'cliente' : 'clientes'} na fila
          </p>
          <input
            placeholder="🔎 Buscar por cliente ou posição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ marginBottom: 12 }}
          />
        </>
      )}

      {carregando && <p className="muted">Carregando...</p>}
      {erro && <p className="erro">{erro}</p>}
      {!carregando && !fila.length && <div className="card center muted">A fila está vazia no momento.</div>}

      <div className="stack">
        {fila
          .filter((item) => {
            const q = normaliza(busca.trim());
            return !q || normaliza(item.cliente).includes(q) || String(item.posicao).includes(q);
          })
          .map((item) => (
          <div
            className="card"
            key={item.pedidoId}
            style={item.meu ? { borderColor: 'var(--gold)' } : undefined}
          >
            <div className="between">
              <div className="row">
                <span className="total" style={{ fontSize: 26 }}>#{item.posicao}</span>
                <div>
                  <strong>
                    {item.cliente}
                    {item.meu && <span className="muted"> (você)</span>}
                  </strong>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {item.tipo === 'model' ? 'Model' : 'Item avulso'}
                  </div>
                </div>
              </div>
              <div className="center">
                <span className={`badge ${item.status === 'em_producao' ? 'gold' : 'info'}`}>
                  {statusLabel(item.status)}
                </span>
                {item.status === 'em_producao' && (
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    {janelaPrazo(item.dataEntrouProducao, item.prazoEstimado) || '20 a 45 dias'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
