import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ItemImagem from '../components/ItemImagem';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogProvider';
import { api } from '../services/api';
import { formatBRL, statusLabel, STATUS_INFO, janelaPrazo, DISCORD_CONVITE } from '../utils/pedido';

// Lista de itens de uma seleção (versão ou itens avulsos)
function ListaItens({ itens }) {
  return (
    <table>
      <tbody>
        {itens.map((it, i) => (
          <tr key={i}>
            <td style={{ width: 52 }}>
              <ItemImagem url={it.variante?.imagemExemplo} />
            </td>
            <td>
              {it.variante?.nome || 'Item'}
              {it.quantidade > 1 && <span className="muted"> ×{it.quantidade}</span>}
              {it.cor && <span className="muted"> · cor: {it.cor}</span>}
              {it.observacao && <div className="muted" style={{ fontSize: 13 }}>“{it.observacao}”</div>}
              {it.descricoes?.filter(Boolean).map((d, j) => (
                <div key={j} className="muted" style={{ fontSize: 13 }}>• {d}</div>
              ))}
            </td>
            <td style={{ textAlign: 'right' }}>
              {it.valorAprovado != null ? (
                <span className="preco">{formatBRL(it.valorAprovado * (it.quantidade || 1))}</span>
              ) : (
                <span className="muted">a orçar</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Bloco do atendimento no Discord (ticket do pedido)
function BlocoDiscord({ pedido }) {
  if (!pedido.discordCanalUrl && !DISCORD_CONVITE) return null;
  return (
    <div className="aviso" style={{ marginTop: 12 }}>
      💬 <strong>Atendimento no Discord.</strong> O <strong>pagamento</strong>, a conversa, os
      ajustes e a entrega do seu model são combinados direto com o artista no ticket. Entre para
      acertar tudo por lá.
      <div className="btn-row" style={{ marginTop: 8 }}>
        {DISCORD_CONVITE && (
          <a href={DISCORD_CONVITE} target="_blank" rel="noopener noreferrer">
            <button className="pequeno">Entrar no servidor</button>
          </a>
        )}
        {pedido.discordCanalUrl && (
          <a href={pedido.discordCanalUrl} target="_blank" rel="noopener noreferrer">
            <button className="secundario pequeno">Abrir meu ticket</button>
          </a>
        )}
      </div>
    </div>
  );
}

// Campo para aplicar/remover cupom (cliente ou artista)
function CupomBox({ pedido, token, onMudou }) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function aplicar() {
    setCarregando(true);
    setErro('');
    try {
      const p = await api.put(`/pedidos/${pedido._id}/cupom`, { codigo }, token);
      onMudou(p);
      setCodigo('');
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }
  async function remover() {
    onMudou(await api.delete(`/pedidos/${pedido._id}/cupom`, token));
  }

  if (pedido.cupom) {
    return (
      <div className="row" style={{ marginTop: 8 }}>
        <span className="ok">Cupom {pedido.cupom} aplicado ✓</span>
        <button className="secundario pequeno" onClick={remover}>Remover</button>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 8 }}>
      <label>
        Tem um cupom?
        <div className="row" style={{ gap: 8 }}>
          <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="CÓDIGO" style={{ maxWidth: 180 }} />
          <button className="pequeno" onClick={aplicar} disabled={carregando || !codigo.trim()}>Aplicar</button>
        </div>
      </label>
      {erro && <p className="erro">{erro}</p>}
    </div>
  );
}

export default function PedidoDetalhe() {
  const { id } = useParams();
  const { token } = useAuth();
  const { confirmar } = useDialog();
  const [pedido, setPedido] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [acao, setAcao] = useState(false);
  const [discordUsuario, setDiscordUsuario] = useState('');

  const carregar = useCallback(async () => {
    try {
      const p = await api.get(`/pedidos/${id}`, token);
      setPedido(p);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [id, token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function responder(rota, body = null) {
    setAcao(true);
    setErro('');
    try {
      const p = await api.put(`/pedidos/${id}/${rota}`, body, token);
      setPedido(p);
    } catch (e) {
      setErro(e.message);
    } finally {
      setAcao(false);
    }
  }

  async function cancelar() {
    if (await confirmar({
      titulo: 'Cancelar pedido',
      mensagem: 'Tem certeza que deseja cancelar este pedido? Não dá pra desfazer.',
      okLabel: 'Cancelar pedido',
      cancelLabel: 'Voltar',
      perigo: true,
    })) {
      responder('cancelar');
    }
  }

  if (carregando) return <Layout><p className="muted">Carregando...</p></Layout>;
  if (erro && !pedido) return <Layout><p className="erro">{erro}</p></Layout>;
  if (!pedido) return null;

  const info = STATUS_INFO[pedido.status] || {};

  return (
    <Layout largura="container-narrow">
      <Link to="/meus-pedidos" className="muted">← Meus pedidos</Link>
      <div className="between" style={{ margin: '12px 0' }}>
        <h1 style={{ margin: 0 }}>
          {pedido.numero ? `#${pedido.numero} ` : ''}
          {pedido.tipo === 'model' ? 'Model personalizado' : 'Item avulso'}
        </h1>
        <span className={`badge ${info.cor || ''}`}>{statusLabel(pedido.status)}</span>
      </div>

      {/* Conteúdo do pedido */}
      {pedido.tipo === 'model' ? (
        (pedido.versoes || []).map((v, i) => (
          <div className="card" key={i}>
            <div className="between">
              <h3 style={{ margin: 0 }}>{v.nome}</h3>
              {v.valorAprovado != null && <span className="preco">{formatBRL(v.valorAprovado)}</span>}
            </div>
            <ListaItens itens={v.itens} />
          </div>
        ))
      ) : (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Itens avulsos</h3>
          <ListaItens itens={pedido.itensAvulsos || []} />
        </div>
      )}

      {pedido.itensPersonalizados?.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Itens personalizados</h3>
          <table>
            <tbody>
              {pedido.itensPersonalizados.map((ip, i) => (
                <tr key={i}>
                  <td><strong>{ip.tipo}:</strong> {ip.descricao}</td>
                  <td style={{ textAlign: 'right' }}>
                    {ip.valor != null ? <span className="preco">{formatBRL(ip.valor)}</span> : <span className="muted">a orçar</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pedido.observacaoAdmin && (
        <div className="aviso">
          <strong>Recado do artista:</strong> {pedido.observacaoAdmin}
        </div>
      )}

      {/* Total + ações por status */}
      <div className="card">
        {pedido.valorTotal != null && (
          <>
            <div className="between">
              <span className="muted">Total</span>
              <span
                className={pedido.descontoValor ? 'muted' : 'total'}
                style={pedido.descontoValor ? { textDecoration: 'line-through' } : undefined}
              >
                {formatBRL(pedido.valorTotal)}
              </span>
            </div>
            {pedido.descontoValor > 0 && (
              <>
                <div className="between">
                  <span className="muted">Cupom {pedido.cupom}</span>
                  <span className="ok">− {formatBRL(pedido.descontoValor)}</span>
                </div>
                <div className="between">
                  <span className="muted">Com desconto</span>
                  <span className="total">{formatBRL(pedido.valorTotal - pedido.descontoValor)}</span>
                </div>
              </>
            )}
          </>
        )}

        {erro && <p className="erro">{erro}</p>}

        {pedido.status === 'pendente_aprovacao' && (
          <>
            <p className="muted">Seu pedido foi enviado! Aguarde o artista revisar e enviar o orçamento.</p>
            <button className="perigo pequeno" onClick={cancelar} disabled={acao}>Cancelar pedido</button>
          </>
        )}

        {pedido.status === 'orcado' && (
          <>
            <p>
              O artista enviou o orçamento. Ao aceitar, abrimos um <strong>atendimento no Discord</strong>{' '}
              com todos os detalhes do seu model. Por lá você faz o <strong>Pix da entrada (50%)</strong> e{' '}
              <strong>envia o comprovante no ticket</strong>; assim que o artista confirmar, seu pedido entra
              na fila de produção.
            </p>
            <CupomBox pedido={pedido} token={token} onMudou={setPedido} />
            <label style={{ marginTop: 10 }}>
              Seu usuário do Discord <span className="muted" style={{ fontWeight: 400 }}>(opcional, ajuda o artista a te achar)</span>
              <input
                placeholder="ex: fulano#0001 ou @fulano"
                value={discordUsuario}
                onChange={(e) => setDiscordUsuario(e.target.value)}
              />
            </label>
            <div className="btn-row" style={{ marginTop: 10 }}>
              <button
                className="sucesso"
                onClick={() => responder('aceitar', { discordUsuario })}
                disabled={acao}
              >
                Aceitar orçamento
              </button>
              <button className="perigo" onClick={() => responder('recusar')} disabled={acao}>
                Recusar
              </button>
            </div>
          </>
        )}

        {pedido.status === 'aguardando_pagamento' && (
          <>
            <p className="ok">Orçamento aceito! Falta só o pagamento para entrar na fila. 🐝</p>
            <div className="aviso" style={{ marginTop: 4 }}>
              💸 <strong>Pague a entrada (50%) via Pix e envie o comprovante no ticket do Discord.</strong>{' '}
              A chave Pix e o nome estão lá no ticket. Assim que o artista confirmar que o valor caiu na conta,
              seu pedido vai automaticamente para a fila de produção.
            </div>
            <BlocoDiscord pedido={pedido} />
          </>
        )}

        {pedido.status === 'fila_producao' && (
          <>
            <p className="ok">Pagamento confirmado! Seu pedido está na fila de produção. <Link to="/fila">Ver a fila</Link></p>
            <BlocoDiscord pedido={pedido} />
          </>
        )}

        {pedido.status === 'em_producao' && (
          <>
            <p className="ok">
              Seu pedido está sendo produzido! Previsão de entrega:{' '}
              <strong>{janelaPrazo(pedido.dataEntrouProducao, pedido.prazoEstimado) || '20 a 45 dias'}</strong>.
            </p>
            <BlocoDiscord pedido={pedido} />
          </>
        )}

        {pedido.status === 'concluido' && (
          <>
            <p className="ok">Pedido concluído! 🐝 O artista combina a entrega com você no Discord.</p>
            <BlocoDiscord pedido={pedido} />
          </>
        )}
        {pedido.status === 'recusado_cliente' && <p className="muted">Você recusou este orçamento.</p>}
        {pedido.status === 'cancelado' && <p className="muted">Este pedido foi cancelado.</p>}
      </div>
    </Layout>
  );
}
