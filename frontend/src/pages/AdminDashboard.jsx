import { useCallback, useEffect, useMemo, useState } from 'react';
import Icone from '../components/Icone';
import EstadoVazio from '../components/EstadoVazio';
import Cabecalho from '../components/Cabecalho';
import { useSite } from '../context/SiteContext';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import AdminEditarItens from '../components/AdminEditarItens';
import ItemImagem from '../components/ItemImagem';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogProvider';
import { api } from '../services/api';
import { formatBRL, faixaPreco, statusLabel, STATUS_INFO, normaliza, TAXA_ENTREGA_PRIORITARIA } from '../utils/pedido';

const ABAS = [
  { status: 'pendente_aprovacao', label: 'A orçar' },
  { status: 'orcado', label: 'Aguardando cliente' },
  { status: 'aguardando_pagamento', label: 'Confirmar pagamento' },
  { status: 'fila_producao', label: 'Na fila' },
  { status: 'em_producao', label: 'Em produção' },
  { status: 'concluido', label: 'Concluídos' },
  { status: 'recusado_cliente,cancelado,expirado', label: 'Recusados' },
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
    if (pedido.entregaPrioritaria) s += TAXA_ENTREGA_PRIORITARIA;
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
              <span className="muted" style={{ fontSize: 16 }}> (tabela: {faixaPreco(it.variante)})</span>
            )}
            {(it.observacao || it.descricao) && (
              <span className="muted" style={{ fontSize: 16 }}> — {it.observacao || it.descricao}</span>
            )}
            {it.descricoes?.filter(Boolean).length > 0 && (
              <span className="muted" style={{ fontSize: 16 }}> — {it.descricoes.filter(Boolean).join(' | ')}</span>
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
      {pedido.entregaPrioritaria && (
        <div className="between">
          <span className="muted"><Icone nome="raio" /> Entrega prioritária (3 a 5 dias úteis)</span>
          <span className="preco">+ {formatBRL(TAXA_ENTREGA_PRIORITARIA)}</span>
        </div>
      )}
      <div className="between">
        <span className="muted">Subtotal dos itens{pedido.entregaPrioritaria ? ' + prioridade' : ''}</span>
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
    <div className="stack" style={{ fontSize: 16 }}>
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
  // filtros extras e seleção para apagar vários
  const [fTipo, setFTipo] = useState('');
  const [fPeriodo, setFPeriodo] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fPrioritaria, setFPrioritaria] = useState(false);
  const [marcados, setMarcados] = useState(() => new Set());
  const [pedidos, setPedidos] = useState([]);
  const [contagem, setContagem] = useState(null); // null = ainda não carregou (ou backend antigo)
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
      setMsgLimite('salvo');
      setTimeout(() => setMsgLimite(''), 2000);
    } catch (e) {
      setMsgLimite(e.message);
    } finally {
      setSalvandoLimite(false);
    }
  }

  // ---- liga/desliga o site para os clientes ----
  const { recarregar: recarregarSite } = useSite();
  const [site, setSite] = useState(null); // { aberto, mensagem, mensagemPersonalizada }
  const [aviso, setAviso] = useState('');
  const [mudandoSite, setMudandoSite] = useState(false);
  const [msgSite, setMsgSite] = useState('');

  useEffect(() => {
    api
      .get('/admin/site', token)
      .then((s) => {
        setSite(s);
        setAviso(s.mensagemPersonalizada || '');
      })
      .catch(() => {});
  }, [token]);

  async function alternarSite() {
    const desligar = site?.aberto !== false;
    const ok = await confirmar({
      titulo: desligar ? 'Desligar o site' : 'Ligar o site',
      mensagem: desligar
        ? 'Os clientes não vão mais conseguir fazer pedidos nem ver o site: eles verão um aviso de pausa. Você e os outros artistas continuam entrando normalmente.\n\nPedidos que já existem não são apagados.'
        : 'O site volta a funcionar para os clientes agora.',
      okLabel: desligar ? 'Desligar' : 'Ligar',
      cancelLabel: 'Voltar',
      perigo: desligar,
    });
    if (!ok) return;
    setMudandoSite(true);
    setMsgSite('');
    try {
      const s = await api.put('/admin/site', { aberto: !desligar }, token);
      setSite(s);
      recarregarSite();
    } catch (e) {
      setMsgSite(e.message);
    } finally {
      setMudandoSite(false);
    }
  }

  // ---- boosters do servidor (contagem e nomes no Discord) ----
  const [boosters, setBoosters] = useState(null);
  const [carregandoBoosters, setCarregandoBoosters] = useState(false);
  function carregarBoosters() {
    setCarregandoBoosters(true);
    api
      .get('/admin/boosters', token)
      .then(setBoosters)
      .catch(() => setBoosters({ indisponivel: true }))
      .finally(() => setCarregandoBoosters(false));
  }

  async function alternarBoosters() {
    const ligar = !site?.somenteBoosters;
    const ok = await confirmar({
      titulo: ligar ? 'Pedidos só para boosters' : 'Abrir pedidos para todos',
      mensagem: ligar
        ? 'Só quem der boost no servidor do Discord vai conseguir fazer pedidos. Todo mundo continua vendo o site. Você e os outros artistas não são afetados, e pedidos que já existem seguem normalmente.'
        : 'Qualquer pessoa que entrar com o Discord poderá fazer pedidos de novo.',
      okLabel: ligar ? 'Ligar' : 'Desligar',
      cancelLabel: 'Voltar',
    });
    if (!ok) return;
    setMudandoSite(true);
    setMsgSite('');
    try {
      const s = await api.put('/admin/site', { somenteBoosters: ligar }, token);
      setSite(s);
      recarregarSite();
    } catch (e) {
      setMsgSite(e.message);
    } finally {
      setMudandoSite(false);
    }
  }

  async function salvarAviso() {
    setMudandoSite(true);
    setMsgSite('');
    try {
      const s = await api.put('/admin/site', { mensagem: aviso }, token);
      setSite(s);
      recarregarSite();
      setMsgSite('salvo');
    } catch (e) {
      setMsgSite(e.message);
    } finally {
      setMudandoSite(false);
    }
  }

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const lista = await api.get(`/admin/pedidos?status=${aba}`, token);
      setPedidos(lista);
      api.get('/admin/contagem-pedidos', token).then(setContagem).catch(() => {});
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [aba, token]);

  useEffect(() => {
    setEditando(null);
    setEditandoItens(null);
    setMarcados(new Set());
    setFStatus('');
    carregar();
  }, [carregar]);

  async function concluir(id) {
    if (!(await confirmar({
      titulo: 'Concluir pedido',
      mensagem:
        'Marcar este pedido como concluído? Ele sai da fila, as posições são recalculadas e abre uma vaga.',
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

  async function cancelarPagamento(id) {
    if (!(await confirmar({
      titulo: 'Cancelar pagamento',
      mensagem:
        'Cancelar este pedido? Ele sai da lista de pagamentos e o cliente é avisado no ticket. Não dá pra desfazer.',
      okLabel: 'Cancelar pedido',
      cancelLabel: 'Voltar',
      perigo: true,
    }))) return;
    setAcao(true);
    try {
      await api.put(`/admin/pedidos/${id}/cancelar-pagamento`, null, token);
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setAcao(false);
    }
  }

  // Aviso extra conforme a etapa: apagar um pedido já pago ou em produção é mais sério.
  function avisoApagar(lista) {
    const pagos = lista.filter((p) => ['fila_producao', 'em_producao', 'concluido'].includes(p.status)).length;
    const aguardando = lista.filter((p) => p.status === 'aguardando_pagamento').length;
    let aviso = '';
    if (pagos) aviso += `\n\nAtenção: ${pagos === 1 ? 'este pedido já foi pago' : `${pagos} pedidos já foram pagos`} (fila, produção ou concluído).`;
    if (aguardando) aviso += `\n\n${aguardando === 1 ? 'Este pedido está' : `${aguardando} pedidos estão`} aguardando pagamento.`;
    return aviso + '\n\nO canal do ticket no Discord não é apagado.';
  }

  async function apagarPedidos(lista) {
    if (!lista.length) return;
    const unico = lista.length === 1;
    if (!(await confirmar({
      titulo: unico ? 'Apagar pedido' : `Apagar ${lista.length} pedidos`,
      mensagem: (unico
        ? `Apagar o pedido${lista[0].numero ? ` #${lista[0].numero}` : ''} de ${lista[0].cliente?.nome || 'cliente'} de vez? Não dá para desfazer.`
        : `Apagar ${lista.length} pedidos de vez? Não dá para desfazer.`) + avisoApagar(lista),
      okLabel: unico ? 'Apagar' : `Apagar ${lista.length}`,
      cancelLabel: 'Voltar',
      perigo: true,
    }))) return;
    setAcao(true);
    setErro('');
    try {
      if (unico) await api.delete(`/admin/pedidos/${lista[0]._id}`, token);
      else await api.post('/admin/pedidos/apagar', { ids: lista.map((p) => p._id) }, token);
      setMarcados(new Set());
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setAcao(false);
    }
  }

  // Pedidos da aba depois da busca e dos filtros
  const agora = Date.now();
  const visiveis = pedidos.filter((p) => {
    const q = normaliza(busca.trim());
    if (q) {
      const nomes = [...(p.versoes || []).map((v) => v.nome), p.discordUsuario].filter(Boolean).join(' ');
      if (!normaliza(`${p.numero ?? ''} ${p.cliente?.nome ?? ''} ${p.cliente?.email ?? ''} ${nomes}`).includes(q)) return false;
    }
    if (fTipo && p.tipo !== fTipo) return false;
    if (fStatus && p.status !== fStatus) return false;
    if (fPrioritaria && !p.entregaPrioritaria) return false;
    if (fPeriodo) {
      const dias = (agora - new Date(p.createdAt).getTime()) / 86400000;
      if (fPeriodo === '7' && dias > 7) return false;
      if (fPeriodo === '30' && dias > 30) return false;
      if (fPeriodo === 'antigos' && dias <= 30) return false;
    }
    return true;
  });
  const filtrando = !!(busca.trim() || fTipo || fStatus || fPeriodo || fPrioritaria);
  const idsVisiveis = visiveis.map((p) => p._id);
  const todosMarcados = idsVisiveis.length > 0 && idsVisiveis.every((id) => marcados.has(id));
  const selecionados = pedidos.filter((p) => marcados.has(p._id) && idsVisiveis.includes(p._id));
  const alternarMarca = (id) =>
    setMarcados((m) => {
      const n = new Set(m);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const marcarTodos = () => setMarcados(todosMarcados ? new Set() : new Set(idsVisiveis));
  const limparFiltros = () => {
    setBusca('');
    setFTipo('');
    setFStatus('');
    setFPeriodo('');
    setFPrioritaria(false);
  };

  return (
    <Layout>
      <Cabecalho titulo="Painel do artista" subtitulo="Orce pedidos, confirme pagamentos e acompanhe a produção.">
        <Link to="/admin/catalogo"><button className="secundario">Gerenciar catálogo</button></Link>
      </Cabecalho>

      {site && (
        <div className={'site-status ' + (site.aberto ? 'aberto' : 'pausado')}>
          <div>
            <strong>{site.aberto ? 'Site aberto' : 'Site pausado'}</strong>
            <span className="muted">
              {site.aberto
                ? 'Os clientes podem ver o site e fazer pedidos.'
                : 'Os clientes só veem o aviso de pausa. Só admins entram.'}
            </span>
          </div>
          <button className={site.aberto ? 'perigo' : 'sucesso'} onClick={alternarSite} disabled={mudandoSite}>
            {site.aberto ? 'Desligar o site' : 'Ligar o site'}
          </button>
        </div>
      )}
      {site && (
        <div className={'site-status ' + (site.somenteBoosters ? 'aberto' : '')}>
          <div>
            <strong>{site.somenteBoosters ? 'Pedidos só para boosters' : 'Pedidos abertos a todos'}</strong>
            <span className="muted">
              {site.somenteBoosters
                ? 'Só quem dá boost no servidor do Discord consegue pedir. Todos veem o site.'
                : 'Qualquer pessoa logada com o Discord pode fazer pedido.'}
            </span>
          </div>
          <button className={site.somenteBoosters ? 'secundario' : ''} onClick={alternarBoosters} disabled={mudandoSite}>
            {site.somenteBoosters ? 'Abrir para todos' : 'Só boosters'}
          </button>
        </div>
      )}
      {site && (
        <details className="card limite-card" onToggle={(e) => e.currentTarget.open && carregarBoosters()}>
          <summary>
            Boosters do servidor
            {boosters?.boosters && <span className="muted"> {boosters.boosters.length} {boosters.boosters.length === 1 ? 'pessoa' : 'pessoas'}</span>}
          </summary>
          {carregandoBoosters && <p className="muted">Consultando o Discord...</p>}
          {!carregandoBoosters && boosters?.ativo === false && (
            <p className="muted">O bot do Discord não está configurado neste ambiente.</p>
          )}
          {!carregandoBoosters && boosters?.indisponivel && (
            <p className="erro">Não consegui consultar o Discord agora. Tente abrir de novo em instantes.</p>
          )}
          {!carregandoBoosters && boosters?.ativo && !boosters.indisponivel && (
            <>
              <p>
                <strong>{boosters.boosts}</strong> {boosters.boosts === 1 ? 'boost' : 'boosts'} no servidor
                {boosters.servidor ? ` ${boosters.servidor}` : ''} · nível {boosters.nivel}
                {boosters.listaDisponivel && (
                  <> · <strong>{boosters.boosters.length}</strong> {boosters.boosters.length === 1 ? 'pessoa' : 'pessoas'} dando boost</>
                )}
              </p>
              {boosters.listaDisponivel ? (
                boosters.boosters.length ? (
                  <ul className="lista-boosters">
                    {boosters.boosters.map((b) => (
                      <li key={b.id}>
                        <strong>{b.nome}</strong>
                        <span className="muted"> @{b.usuario} · desde {new Date(b.desde).toLocaleDateString('pt-BR')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Ninguém está dando boost no momento.</p>
                )
              ) : (
                <p className="muted">
                  Para ver os nomes, ligue o <strong>Server Members Intent</strong> do bot no Portal do Desenvolvedor do Discord
                  (Bot &gt; Privileged Gateway Intents). A contagem acima já funciona.
                </p>
              )}
              <button className="secundario pequeno" onClick={carregarBoosters} disabled={carregandoBoosters}>Atualizar</button>
            </>
          )}
        </details>
      )}
      {msgSite && msgSite !== 'salvo' && <p className="erro">{msgSite}</p>}

      <details className="card limite-card">
        <summary>Configuração da fila <span className="muted">limite de {filaLimite || 0} pedidos</span></summary>
        <div className="limite-linha">
          <label htmlFor="limite-fila"><strong>Limite da fila</strong></label>
          <input
            id="limite-fila"
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
          {msgLimite && (
            <span className={msgLimite === 'salvo' ? 'ok' : 'erro'}>
              {msgLimite === 'salvo' ? <><Icone nome="check" /> salvo</> : msgLimite}
            </span>
          )}
        </div>
        <p className="muted limite-nota">
          Ao atingir esse número de pedidos em produção, os clientes não conseguem enviar novos
          pedidos até abrir uma vaga.
        </p>
        {site && (
          <div className="aviso-pausa">
            <label htmlFor="aviso-pausa">Aviso mostrado aos clientes quando o site está pausado</label>
            <textarea
              id="aviso-pausa"
              rows={2}
              maxLength={300}
              value={aviso}
              placeholder="Ex: Estamos de folga até segunda. Voltamos já!"
              onChange={(e) => setAviso(e.target.value)}
            />
            <button className="pequeno" onClick={salvarAviso} disabled={mudandoSite}>Salvar aviso</button>
            {msgSite === 'salvo' && <span className="ok"> <Icone nome="check" /> salvo</span>}
          </div>
        )}
      </details>

      <div className="btn-row abas-status" style={{ marginBottom: 16 }}>
        {ABAS.map((a) => (
          <button
            key={a.status}
            ref={(el) => {
              // com as abas rolando de lado no celular, mantém a ativa à vista
              if (el && aba === a.status) el.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
            }}
            className={'pequeno ' + (aba === a.status ? '' : 'secundario')}
            onClick={() => setAba(a.status)}
          >
            {a.label}
            {contagem && (() => {
              const n = a.status.split(',').reduce((tot, st) => tot + (contagem[st] || 0), 0);
              const pede = ['pendente_aprovacao', 'aguardando_pagamento'].includes(a.status) && n > 0;
              return <span className={'aba-n' + (pede ? ' pede' : '')} aria-label={`${n} pedidos`}>{n}</span>;
            })()}
          </button>
        ))}
      </div>

      {pedidos.length > 0 && (
        <div className="filtros-pedidos">
          <input
            className="busca-input" placeholder="Buscar por cliente, e-mail, número ou personagem..."
            aria-label="Buscar pedidos"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <div className="filtros-linha">
            <select aria-label="Tipo de pedido" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="model">Model</option>
              <option value="item_avulso">Item avulso</option>
            </select>
            <select aria-label="Período" value={fPeriodo} onChange={(e) => setFPeriodo(e.target.value)}>
              <option value="">Qualquer data</option>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="antigos">Mais de 30 dias</option>
            </select>
            {aba.includes(',') && (
              <select aria-label="Situação" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                <option value="">Todas as situações</option>
                <option value="recusado_cliente">Recusados</option>
                <option value="cancelado">Cancelados</option>
                <option value="expirado">Expirados</option>
              </select>
            )}
            <label className="check-linha filtro-check">
              <input type="checkbox" checked={fPrioritaria} onChange={(e) => setFPrioritaria(e.target.checked)} />
              Só prioritárias
            </label>
            {filtrando && <button className="secundario pequeno" onClick={limparFiltros}>Limpar filtros</button>}
          </div>
          <div className="selecao-barra">
            <label className="check-linha">
              <input type="checkbox" checked={todosMarcados} onChange={marcarTodos} disabled={!idsVisiveis.length} />
              {todosMarcados ? 'Desmarcar todos' : 'Selecionar todos'}
              <span className="muted"> ({visiveis.length}{filtrando ? ` de ${pedidos.length}` : ''})</span>
            </label>
            {selecionados.length > 0 && (
              <>
                <span className="muted">{selecionados.length} selecionado{selecionados.length > 1 ? 's' : ''}</span>
                <button className="perigo pequeno" onClick={() => apagarPedidos(selecionados)} disabled={acao}>
                  Apagar selecionados
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {carregando && <p className="muted">Carregando...</p>}
      {erro && <p className="erro">{erro}</p>}
      {!carregando && pedidos.length > 0 && !visiveis.length && (
        <EstadoVazio titulo="Nenhum pedido com esses filtros" texto="Tire ou mude os filtros para ver os pedidos desta etapa." />
      )}
      {!carregando && !pedidos.length && (
        <EstadoVazio titulo="Nenhum pedido aqui" texto="Quando chegar um pedido nesta etapa, ele aparece nesta lista." />
      )}

      <div className="stack">
        {visiveis
          .map((p) => {
          const info = STATUS_INFO[p.status] || {};
          return (
            <div className={'card' + (marcados.has(p._id) ? ' pedido-marcado' : '')} key={p._id}>
              <div className="between">
                <div>
                  <label className="marca-pedido">
                    <input type="checkbox" checked={marcados.has(p._id)} onChange={() => alternarMarca(p._id)} aria-label={`Selecionar o pedido ${p.numero ?? ''} de ${p.cliente?.nome ?? ''}`} />
                  </label>
                  {p.numero ? <span className="preco" style={{ marginRight: 6 }}>#{p.numero}</span> : null}
                  <strong>{p.cliente?.nome}</strong>{' '}
                  <span className="muted">· {p.cliente?.email}</span>
                  <div className="muted" style={{ fontSize: 16 }}>
                    {p.tipo === 'model' ? 'Model' : 'Item avulso'} ·{' '}
                    {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="center">
                  <span className={`badge ${info.cor || ''}`}>{statusLabel(p.status)}</span>
                  {p.entregaPrioritaria && (
                    <div style={{ marginTop: 6 }}>
                      <span className="badge gold" title="3 a 5 dias úteis"><Icone nome="raio" /> Prioritária</span>
                    </div>
                  )}
                  {p.valorTotal != null && <div className="preco" style={{ marginTop: 6 }}>{formatBRL(p.valorTotal)}</div>}
                </div>
              </div>

              <hr className="divider" />
              <ResumoItens pedido={p} />

              {/* Ações por status */}
              {['pendente_aprovacao', 'orcado', 'recusado_cliente'].includes(p.status) && (
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
                        {['orcado', 'recusado_cliente'].includes(p.status) ? 'Reorçar' : 'Orçar pedido'}
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
                  <div className="aviso" style={{ marginBottom: 8, fontSize: 16 }}>
                    <Icone nome="moeda" /> Confira na sua conta se a <strong>entrada (50%)</strong> caiu. O cliente envia o
                    comprovante no ticket do Discord. Confirmando, o pedido entra na fila de produção.
                  </div>
                  <div className="btn-row acoes-sep">
                    <button className="sucesso pequeno" onClick={() => confirmarPagamento(p._id)} disabled={acao}>
                      Confirmar pagamento
                    </button>
                    <button className="perigo pequeno" onClick={() => cancelarPagamento(p._id)} disabled={acao}>
                      Cancelar pedido
                    </button>
                  </div>
                </div>
              )}

              {['em_producao', 'fila_producao'].includes(p.status) && (
                <div style={{ marginTop: 12 }}>
                  {p.status === 'fila_producao' && (
                    <div className="muted" style={{ fontSize: 16, marginBottom: 6 }}>
                      Terminou este antes dos outros? Pode concluir fora da ordem — ele sai da fila e
                      abre uma vaga.
                    </div>
                  )}
                  <button className="sucesso pequeno" onClick={() => concluir(p._id)} disabled={acao}>
                    Marcar como concluído
                  </button>
                </div>
              )}

              {['recusado_cliente', 'cancelado', 'expirado'].includes(p.status) && (
                <div className="btn-row" style={{ marginTop: 12 }}>
                  {p.status === 'recusado_cliente' && editando !== p._id && (
                    <span className="muted" style={{ fontSize: 16 }}>
                      O cliente recusou. Você pode reorçar acima ou apagar o pedido.
                    </span>
                  )}
                </div>
              )}

              {p.observacaoAdmin && (
                <div className="muted" style={{ marginTop: 10, fontSize: 16 }}>
                  Obs.: {p.observacaoAdmin}
                </div>
              )}

              <div className="row" style={{ marginTop: 10, gap: 14 }}>
                <Link to={`/pedido/${p._id}`} className="muted link-toque" style={{ fontSize: 16 }}>Ver detalhes →</Link>
                <button className="perigo pequeno" onClick={() => apagarPedidos([p])} disabled={acao} style={{ marginLeft: 'auto' }}>
                  Apagar pedido
                </button>
                {p.discordCanalUrl && (
                  <a href={p.discordCanalUrl} target="_blank" rel="noopener noreferrer" className="link-toque" style={{ fontSize: 16 }}>
                    <Icone nome="balao" /> Abrir ticket no Discord
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
