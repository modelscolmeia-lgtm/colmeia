import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function NovoCupom({ token, onCriado }) {
  const vazio = { codigo: '', tipo: 'percentual', valor: '', usosPorUsuario: '', descricao: '' };
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const set = (c, v) => setForm((f) => ({ ...f, [c]: v }));

  async function criar() {
    if (!form.codigo.trim()) return setErro('Informe o código');
    setSalvando(true);
    setErro('');
    try {
      await api.post('/admin/cupons', { ...form, valor: Number(form.valor) || 0, usosPorUsuario: Number(form.usosPorUsuario) || 0 }, token);
      setForm(vazio);
      onCriado();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Novo cupom</h3>
      <div className="row" style={{ gap: 8 }}>
        <label style={{ width: 150 }}>
          Código
          <input value={form.codigo} onChange={(e) => set('codigo', e.target.value.toUpperCase())} placeholder="BEMVINDO10" />
        </label>
        <label style={{ width: 150 }}>
          Tipo
          <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
            <option value="percentual">Percentual (%)</option>
            <option value="fixo">Valor fixo (R$)</option>
          </select>
        </label>
        <label style={{ width: 110 }}>
          {form.tipo === 'percentual' ? 'Desconto (%)' : 'Desconto (R$)'}
          <input type="number" min={0} step="0.01" value={form.valor} onChange={(e) => set('valor', e.target.value)} />
        </label>
        <label style={{ width: 150 }}>
          Usos por pessoa
          <input type="number" min={0} step="1" placeholder="0 = ilimitado" value={form.usosPorUsuario} onChange={(e) => set('usosPorUsuario', e.target.value)} />
        </label>
      </div>
      <label style={{ marginTop: 8 }}>
        Descrição (opcional)
        <input value={form.descricao} onChange={(e) => set('descricao', e.target.value)} />
      </label>
      {erro && <p className="erro">{erro}</p>}
      <button onClick={criar} disabled={salvando} style={{ marginTop: 10 }}>{salvando ? 'Criando...' : 'Criar cupom'}</button>
    </div>
  );
}

export default function AdminCupons() {
  const { token } = useAuth();
  const [cupons, setCupons] = useState([]);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try {
      setCupons(await api.get('/admin/cupons', token));
    } catch (e) {
      setErro(e.message);
    }
  }, [token]);

  useEffect(() => { carregar(); }, [carregar]);

  async function toggle(c) {
    await api.put(`/admin/cupons/${c._id}`, { ativo: !c.ativo }, token);
    carregar();
  }
  async function excluir(c) {
    if (!confirm(`Excluir o cupom ${c.codigo}?`)) return;
    await api.delete(`/admin/cupons/${c._id}`, token);
    carregar();
  }

  return (
    <Layout largura="container-narrow">
      <div className="between">
        <h1>Cupons</h1>
        <Link to="/admin"><button className="secundario pequeno">← Painel</button></Link>
      </div>
      <p className="muted">
        Crie cupons de desconto. O cliente (ou você) aplica o código no pedido, na tela de detalhe.
      </p>

      <NovoCupom token={token} onCriado={carregar} />
      {erro && <p className="erro">{erro}</p>}

      <div className="stack" style={{ marginTop: 16 }}>
        {cupons.map((c) => (
          <div className="card" key={c._id} style={{ opacity: c.ativo ? 1 : 0.55 }}>
            <div className="between">
              <div>
                <strong style={{ fontSize: 20 }}>{c.codigo}</strong>{' '}
                <span className="preco">
                  {c.tipo === 'percentual' ? `${c.valor}% OFF` : `R$ ${c.valor} OFF`}
                </span>
                <span className="muted" style={{ fontSize: 14 }}>
                  {' · '}{c.usosPorUsuario > 0 ? `${c.usosPorUsuario}× por pessoa` : 'usos ilimitados'}
                </span>
                {c.descricao && <div className="muted" style={{ fontSize: 14 }}>{c.descricao}</div>}
              </div>
              <div className="btn-row">
                <button className="secundario pequeno" onClick={() => toggle(c)}>
                  {c.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button className="perigo pequeno" onClick={() => excluir(c)}>Excluir</button>
              </div>
            </div>
          </div>
        ))}
        {!cupons.length && <div className="card center muted">Nenhum cupom ainda.</div>}
      </div>
    </Layout>
  );
}
