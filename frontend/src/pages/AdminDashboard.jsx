import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import AdminEditarItens from '../components/AdminEditarItens';
import ItemImagem from '../components/ItemImagem';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogProvider';
import { api } from '../services/api';
import { formatBRL, faixaPreco, statusLabel, STATUS_INFO, normaliza } from '../utils/pedido';

const ABAS = [
  { status: 'pendente_aprovacao', label: 'A orçar' },
  { status: 'orcado', label: 'Aguardando cliente' },
  { status: 'aguardando_pagamento', label: 'Confirmar pagamento' },
  { status: 'fila_producao', label: 'Na fila' },
  { status: 'em_producao', label: 'Em produção' },
  { status: 'concluido', label: 'Concluídos' },
  { status: 'recusado_cliente,cancelado', label: 'Recusados' },
];

// Editor de orçamento: já vem com os preços da tabela preenchidos; o admin só ajusta.
function EditorOrcamento({ pedido, token, onSalvo }) {
  // Pré-preenche cada item com o valor já aprovado (se reorçando) ou o preço mínimo
  // da tabela do catálogo. Itens personalizados ficam em branco (o admin define).
  const [valores, setValores] = useState(() => {
    const iniciais = {};
    const precoTabela = (it) => it.valorAprovado ?? it.variante?.precoMin ?? '';
    (pedido.versoes || []).forEach((v, vi) =>
      v.itens.forEach((it, ii) => { iniciais[`v${vi}_i${ii}`] = precoTabela(it); })
    );
    (pedido.itensAvulsos || []).forEach((it, ai) => { iniciais[`a${ai}`] = precoTabela(it); });
    (pedido.itensPersonalizados || []).forEach((ip, pi) => {
      if (ip.valor != null) iniciais[`p${pi}`] = ip.valor;
    });
    return iniciais;
  });
  const [total, setTotal] = useState('');
  const [obs, setObs] = useState(pedido.observacaoAdmin || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const set = (chave, v) => setValores((m) => ({ ...m, [chave]: v }));

  // Subtotal sugerido a partir dos valores por item.
  const subtotal = useMemo(() => {
    let s = 0;
    (pedido.versoes || []).forEach((v, vi) =>
      v.itens.forEach((it, ii) => {
        s += (Number(valores[`v${vi}_i${ii}`]) || 0) * (it.quantidade || 1);
      })
    );
    (pedido.itensAvulsos || []).forEach((it, ai) => {
      s += (Number(valores[`a${ai}`]) || 0) * (it.quantidade || 1);
    });
    (pedido.itensPersonalizados || []).forEach((_, pi) => {
      s += Number(valores[`p${pi}`]) || 0;
    });
    return s;
  }, [valores, pedido]);

  function linhaItem(it, chave) {
    return (
      <div className="between" key={chave} style={{ gap: 10 }}>
        <div className="row" style={{ gap: 8, flex: 1, minWidth: 0 }}>
          <ItemImagem url={it.variante?.imagemExemplo} size={40} />
          <span>
            {it.variante?.nome || it.tipo || 'Item'}
            {it.quantidade > 1 && <span className="muted"> ×{it.quantidade}</span>}
            {it.cor && <span className="muted"> · cor: {it.cor}</span>}
            {it.variante && (
              <span className="muted" style={{ fontSize: 13 }}> (tabela: {faixaPreco(it.variante)})</span>
            )}
            {(it.observacao || it.descricao) && (
              <span className="muted" style={{ fontSize: 13 }}> — {it.observacao || it.descricao}</span>
            )}
            {it.descricoes?.filter(Boolean).length > 0 && (
              <span className="muted" style={{ fontSize: 13 }}> — {it.descricoes.filter(Boolean).join(' | ')}</span>
            )}
          </span>
        </div>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          R$
          <input
            className="input-sm"
            type="number"
            min={0}
            step="0.01"
            value={valores[chave] ?? ''}
            onChange={(e) => set(chave, e.target.value)}
          />
        </label>
      </div>
    );
  }

  async function salvar() {
    setSalvando(true);
    setErro('');
    try {
      const payload = {
        versoes: (pedido.versoes || []).map((v, vi) => ({
          itens: v.itens.map((_, ii) => ({
            valorAprovado: valores[`v${vi}_i${ii}`] !== undefined && valores[`v${vi}_i${ii}`] !== ''
              ? Number(valores[`v${vi}_i${ii}`]) : undefined,
          })),
        })),
        itensAvulsos: (pedido.itensAvulsos || []).map((_, ai) => ({
          valorAprovado: valores[`a${ai}`] !== undefined && valores[`a${ai}`] !== ''
            ? Number(valores[`a${ai}`]) : undefined,
        })),
        itensPersonalizados: (pedido.itensPersonalizados || []).map((_, pi) => ({
          valor: valores[`p${pi}`] !== undefined && valores[`p${pi}`] !== ''
            ? Number(valores[`p${pi}`]) : undefined,
        })),
        valorTotal: total !== '' ? Number(total) : subtotal,
        observacaoAdmin: obs,
      };
      await api.put(`/admin/pedidos/${pedido._id}/orcar`, payload, token);
      onSalvo();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="card card-2" style={{ background: 'var(--card-2)', marginTop: 12 }}>
      <h4 style={{ marginTop: 0 }}>Definir orçamento</h4>

      {(pedido.versoes || []).map((v, vi) => (
        <div key={vi} style={{ marginBottom: 10 }}>
          <strong>{v.nome}</strong>
          <div className="stack" style={{ marginTop: 6 }}>
            {v.itens.map((it, ii) => linhaItem(it, `v${vi}_i${ii}`))}
          </div>
        </div>
      ))}

      {(pedido.itensAvulsos || []).length > 0 && (
        <div className="stack">{pedido.itensAvulsos.map((it, ai) => linhaItem(it, `a${ai}`))}</div>
      )}

      {(pedido.itensPersonalizados || []).length > 0 && (
        <div style={{ marginTop: 10 }}>
          <strong>Personalizados</strong>
          <div className="stack" style={{ marginTop: 6 }}>
            {pedido.itensPersonalizados.map((ip, pi) => linhaItem(ip, `p${pi}`))}
          </div>
        </div>
      )}

      <hr className="divider" />
      <div className="between">
        <span className="muted">Subtotal dos itens</span>
        <span className="preco">{formatBRL(subtotal)}</span>
      </div>
      <label style={{ marginTop: 10 }}>
        Total a cobrar (deixe vazio para usar o subtotal)
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder={String(subtotal)}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
      </label>
      <label style={{ marginTop: 10 }}>
        Observação para o cliente (opcional)
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} />
      </label>

      {erro && <p className="erro">{erro}</p>}
      <button onClick={salvar} disabled={salvando} style={{ marginTop: 10 }}>
        {salvando ? 'Enviando...' : 'Enviar orçamento ao cliente'}
      </button>
    </div>
  );
}

// Lista horizontal de itens com miniatura + nome.
function ItensComImagem({ itens }) {
  return (
    <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
      {itens.map((it, i) => (
        <span key={i} className="row" style={{ gap: 6 }}>
          <ItemImagem url={it.variante?.imagemExemplo} size={36} />
          <span>
            {it.variante?.nome || 'Item'}
            {it.quantidade > 1 && <span className="muted"> ×{it.quantidade}</span>}
            {it.cor && <span className="muted"> · {it.cor}</span>}
          </span>
        </span>
      ))}
    </div>
  );
}

function ResumoItens({ pedido }) {
  return (
    <div className="stack" style={{ fontSize: 14 }}>
      {(pedido.versoes || []).map((v) => (
        <div key={v.nome}>
          <strong>{v.nome}</strong>
          <ItensComImagem itens={v.itens} />
        </div>
      ))}
      {pedido.itensAvulsos?.length > 0 && <ItensComImagem itens={pedido.itensAvulsos} />}
      {pedido.itensPersonalizados?.length > 0 && (
        <div className="muted" style={{ marginTop: 4 }}>
          Personalizados: {pedido.itensPersonalizados.map((ip) => ip.tipo).join(', ')}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const { confirmar } = useDialog();
  const [aba, setAba] = useState('pendente_aprovacao');
  const [busca, setBusca] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState(null);
  const [editandoItens, setEditandoItens] = useState(null);
  const [acao, setAcao] = useState(false);
  const [catalogo, setCatalogo] = useState([]);
  const [filaLimite, setFilaLimite] = useState('');
  const [salvandoLimite, setSalvandoLimite] = useState(false);
  const [msgLimite, setMsgLimite] = useState('');

  // catálogo (para o editor de itens poder adicionar variantes)
  useEffect(() => {
    api.get('/catalogo', token).then(setCatalogo).catch(() => {});
  }, [token]);

  // limite da fila (editável por qualquer admin)
  useEffect(() => {
    api.get('/admin/config', token).then((c) => setFilaLimite(c.filaLimite)).catch(() => {});
  }, [token]);

  async function salvarLimite() {
    setSalvandoLimite(true);
    setMsgLimite('');
    try {
      const c = await api.put('/admin/config', { filaLimite: Number(filaLimite) }, token);
      setFilaLimite(c.filaLimite);
      setMsgLimite('✓ salvo');
      setTimeout(() => setMsgLimite(''), 2000);
    } catch (e) {
      setMsgLimite(e.message);
    } finally {
      setSalvandoLimite(false);
    }
  }

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const lista = await api.get(`/admin/pedidos?status=${aba}`, token);
      setPedidos(lista);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [aba, token]);

  useEffect(() => {
    setEditando(null);
    setEditandoItens(null);
    carregar();
  }, [carregar]);

  async function concluir(id) {
    if (!(await confirmar({
      titulo: 'Concluir pedido',
      mensagem: 'Marcar este pedido como concluído? O próximo da fila entra em produção.',
      okLabel: 'Concluir',
    }))) return;
    setAcao(true);
    try {
      await api.put(`/admin/pedidos/${id}/concluir`, null, token);
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setAcao(false);
    }
  }

  async function confirmarPagamento(id) {
    if (!(await confirmar({
      titulo: 'Confirmar pagamento',
      mensagem: 'Confirmar que o pagamento caiu na conta? O pedido vai para a fila de produção.',
      okLabel: 'Confirmar',
    }))) return;
    setAcao(true);
    try {
      await api.put(`/admin/pedidos/${id}/confirmar-pagamento`, null, token);
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setAcao(false);
    }
  }

  return (
    <Layout>
      <div className="between">
        <h1>Painel do artista</h1>
        <Link to="/admin/catalogo"><button className="secundario pequeno">Gerenciar catálogo</button></Link>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label className="row" style={{ alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: 0 }}>
          <strong>Limite de pedidos na fila:</strong>
          <input
            type="number"
            min={1}
            step={1}
            value={filaLimite}
            onChange={(e) => setFilaLimite(e.target.value)}
            style={{ width: 90 }}
          />
          <button className="pequeno" onClick={salvarLimite} disabled={salvandoLimite || !filaLimite}>
            {salvandoLimite ? 'Salvando...' : 'Salvar'}
          </button>
          {msgLimite && <span className={msgLimite.startsWith('✓') ? 'ok' : 'erro'}>{msgLimite}</span>}
        </label>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
          Ao atingir esse número de pedidos em produção, os clientes não conseguem enviar novos
          pedidos até abrir uma vaga.
        </p>
      </div>

      <div className="btn-row" style={{ marginBottom: 16 }}>
        {ABAS.map((a) => (
          <button
            key={a.status}
            className={'pequeno ' + (aba === a.status ? '' : 'secundario')}
            onClick={() => setAba(a.status)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {pedidos.length > 0 && (
        <input
          placeholder="🔎 Buscar por cliente, e-mail ou número..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ marginBottom: 12 }}
        />
      )}

      {carregando && <p className="muted">Carregando...</p>}
      {erro && <p className="erro">{erro}</p>}
      {!carregando && !pedidos.length && (
        <div className="card center muted">Nenhum pedido nesta categoria.</div>
      )}

      <div className="stack">
        {pedidos
          .filter((p) => {
            const q = normaliza(busca.trim());
            if (!q) return true;
            return normaliza(`${p.numero ?? ''} ${p.cliente?.nome ?? ''} ${p.cliente?.email ?? ''}`).includes(q);
          })
          .map((p) => {
          const info = STATUS_INFO[p.status] || {};
          return (
            <div className="card" key={p._id}>
              <div className="between">
                <div>
                  {p.numero ? <span className="preco" style={{ marginRight: 6 }}>#{p.numero}</span> : null}
                  <strong>{p.cliente?.nome}</strong>{' '}
                  <span className="muted">· {p.cliente?.email}</span>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {p.tipo === 'model' ? 'Model' : 'Item avulso'} ·{' '}
                    {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="center">
                  <span className={`badge ${info.cor || ''}`}>{statusLabel(p.status)}</span>
                  {p.valorTotal != null && <div className="preco" style={{ marginTop: 6 }}>{formatBRL(p.valorTotal)}</div>}
                </div>
              </div>

              <hr className="divider" />
              <ResumoItens pedido={p} />

              {/* Ações por status */}
              {['pendente_aprovacao', 'orcado'].includes(p.status) && (
                <div style={{ marginTop: 12 }}>
                  {editandoItens === p._id ? (
                    <AdminEditarItens
                      pedido={p}
                      token={token}
                      catalogo={catalogo.filter((c) => c.tipo === p.tipo)}
                      onSalvo={() => { setEditandoItens(null); setAba('pendente_aprovacao'); carregar(); }}
                      onCancelar={() => setEditandoItens(null)}
                    />
                  ) : editando === p._id ? (
                    <EditorOrcamento
                      pedido={p}
                      token={token}
                      onSalvo={() => { setEditando(null); carregar(); }}
                    />
                  ) : (
                    <div className="btn-row">
                      <button className="pequeno" onClick={() => { setEditando(p._id); setEditandoItens(null); }}>
                        {p.status === 'orcado' ? 'Reorçar' : 'Orçar pedido'}
                      </button>
                      <button className="secundario pequeno" onClick={() => { setEditandoItens(p._id); setEditando(null); }}>
                        Editar itens
                      </button>
                    </div>
                  )}
                </div>
              )}

              {p.status === 'aguardando_pagamento' && (
                <div style={{ marginTop: 12 }}>
                  <div className="aviso" style={{ marginBottom: 8, fontSize: 13 }}>
                    💸 Confira na sua conta se a <strong>entrada (50%)</strong> caiu. O cliente envia o
                    comprovante no ticket do Discord. Confirmando, o pedido entra na fila de produção.
                  </div>
                  <button className="sucesso pequeno" onClick={() => confirmarPagamento(p._id)} disabled={acao}>
                    Confirmar pagamento
                  </button>
                </div>
              )}

              {p.status === 'em_producao' && (
                <div style={{ marginTop: 12 }}>
                  <button className="sucesso pequeno" onClick={() => concluir(p._id)} disabled={acao}>
                    Marcar como concluído
                  </button>
                </div>
              )}

              {p.observacaoAdmin && (
                <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                  Obs.: {p.observacaoAdmin}
                </div>
              )}

              <div className="row" style={{ marginTop: 10, gap: 14 }}>
                <Link to={`/pedido/${p._id}`} className="muted" style={{ fontSize: 13 }}>Ver detalhes →</Link>
                {p.discordCanalUrl && (
                  <a href={p.discordCanalUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                    💬 Abrir ticket no Discord
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
