import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatBRL, statusLabel, STATUS_INFO, normaliza } from '../utils/pedido';

export default function MeusPedidos() {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    api
      .get('/pedidos/meus', token)
      .then(setPedidos)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [token]);

  function resumoItens(p) {
    if (p.tipo === 'model') {
      const total = (p.versoes || []).reduce((acc, v) => acc + v.itens.length, 0);
      const n = p.versoes?.length || 0;
      return `${n} ${n === 1 ? 'personagem' : 'personagens'}, ${total} item(ns)`;
    }
    return `${p.itensAvulsos?.length || 0} item(ns) avulso(s)`;
  }

  return (
    <Layout>
      <div className="between">
        <h1>Meus pedidos</h1>
        <Link to="/montar"><button className="pequeno">+ Novo pedido</button></Link>
      </div>

      {pedidos.length > 0 && (
        <input
          placeholder="🔎 Buscar por número, tipo ou status..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ margin: '12px 0' }}
        />
      )}

      {carregando && <p className="muted">Carregando...</p>}
      {erro && <p className="erro">{erro}</p>}
      {!carregando && !pedidos.length && (
        <div className="card center">
          <p className="muted">Você ainda não fez nenhum pedido.</p>
          <Link to="/montar"><button>Fazer meu primeiro pedido</button></Link>
        </div>
      )}

      <div className="stack">
        {pedidos
          .filter((p) => {
            const q = normaliza(busca.trim());
            if (!q) return true;
            const alvo = normaliza(
              `${p.numero ?? ''} ${p.tipo === 'model' ? 'model personalizado' : 'item avulso'} ${statusLabel(p.status)}`
            );
            return alvo.includes(q);
          })
          .map((p) => {
          const info = STATUS_INFO[p.status] || {};
          return (
            <Link to={`/pedido/${p._id}`} key={p._id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card">
                <div className="between">
                  <div>
                    <strong>
                      {p.numero ? <span className="preco" style={{ marginRight: 6 }}>#{p.numero}</span> : null}
                      {p.tipo === 'model' ? 'Model personalizado' : 'Item avulso'}
                    </strong>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {resumoItens(p)} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="center">
                    <span className={`badge ${info.cor || ''}`}>{statusLabel(p.status)}</span>
                    {p.valorTotal != null && (
                      <div className="preco" style={{ marginTop: 6 }}>{formatBRL(p.valorTotal)}</div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
}
