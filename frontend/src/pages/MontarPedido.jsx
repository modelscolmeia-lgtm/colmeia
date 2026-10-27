import { useEffect, useMemo, useState } from 'react';
import Icone from '../components/Icone';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import PassosCategorias from '../components/PassosCategorias';
import Lightbox from '../components/Lightbox';
import Cabecalho from '../components/Cabecalho';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogProvider';
import { api } from '../services/api';
import {
  faixaPreco,
  formatBRL,
  imagemUrl,
  TAXA_ENTREGA_PRIORITARIA,
  TERMOS_URL,
} from '../utils/pedido';

// Renderiza uma categoria com suas variantes selecionáveis.
function CategoriaBloco({ categoria, selecoes, onToggle, onQtd, onObs, onCor, onDescricao }) {
  const multipla = categoria.permiteMultiplaSelecao;
  const textoQtd = categoria.textoPorQuantidade; // um texto por unidade (ex: expressões)
  const [zoom, setZoom] = useState(null);

  const escolhidos = categoria.variantes.filter((v) => selecoes[v._id]).length;

  // Campos extras (qtd + observação/descrições) quando um item está selecionado.
  // Função que retorna JSX (não é componente) para não perder o foco ao digitar.
  const extras = (v, sel) => (
    <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
      <div className="row">
        {categoria.permiteQuantidade && (
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            Qtd
            <input
              className="input-sm"
              type="number"
              min={1}
              value={sel.quantidade}
              onChange={(e) => onQtd(v._id, Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
        )}
        {!textoQtd && (
          <input
            placeholder="Observação (opcional)"
            value={sel.observacao || ''}
            onChange={(e) => onObs(v._id, e.target.value)}
            style={{ flex: 1, minWidth: 140 }}
          />
        )}
      </div>
      {textoQtd && (
        <div className="stack" style={{ marginTop: 6 }}>
          {Array.from({ length: sel.quantidade || 1 }).map((_, i) => (
            <input
              key={i}
              placeholder={`Descreva a ${categoria.nome.toLowerCase().replace(/s$/, '')} ${i + 1}`}
              value={sel.descricoes?.[i] || ''}
              onChange={(e) => onDescricao(v._id, i, e.target.value)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="categoria-bloco">
      <h4>
        {categoria.nome}{' '}
        <span className="muted" style={{ fontWeight: 400, fontSize: 16 }}>
          ({multipla ? 'pode escolher várias' : 'escolha uma'})
        </span>
        {escolhidos > 0 && <span className="cat-contador">{escolhidos} escolhido{escolhidos > 1 ? 's' : ''}</span>}
      </h4>

      {/* grade de cards: imagem grande, nome, descrição curta e preço */}
      <div className="vgrid">
        {categoria.variantes.map((v) => {
          const sel = selecoes[v._id];
          const corAtual = sel?.cor ? v.cores?.find((c) => c.nome === sel.cor) : undefined; // sem cor escolhida: foto principal
          const img = corAtual?.imagem || v.imagemExemplo;
          return (
            <div key={v._id} className={'vcard' + (sel ? ' selecionada' : '')}>
              <div className="vcard-in">
              {/* foto grande: com imagem, clicar amplia; sem imagem, clicar escolhe */}
              {img ? (
                <button
                  type="button"
                  className="vcard-foto"
                  aria-label={`Ver a imagem de ${v.nome} em tamanho grande`}
                  onClick={() => setZoom(imagemUrl(img))}
                >
                  <span className="vcard-img">
                    <span className="vcard-capa" style={{ '--fundo': `url("${imagemUrl(img)}")` }}>
                      <img src={imagemUrl(img)} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </span>
                  </span>
                </button>
              ) : (
                <button type="button" className="vcard-foto" tabIndex={-1} aria-hidden="true" onClick={() => onToggle(categoria, v)}>
                  <span className="vcard-img">
                    <span className="vcard-capa"><span className="vcard-vazio">sem imagem</span></span>
                  </span>
                </button>
              )}
              <button
                type="button"
                className="vcard-main"
                aria-pressed={!!sel}
                onClick={() => onToggle(categoria, v)}
              >
                <span className="vcard-info">
                  <span className="nome">{v.nome}</span>
                  {v.descricao && <span className="desc">{v.descricao}</span>}
                  <span className="faixa-linha">
                    <span className="faixa">{faixaPreco(v)}</span>
                    <span className="vcard-acao">{sel ? 'Escolhido' : 'Escolher'}</span>
                  </span>
                </span>
              </button>
              {/* quadradinhos de cor: clicar troca a imagem do card; clicar de novo volta à foto principal */}
              {v.cores?.length > 0 && (
                <div className="pet-cores">
                  {v.cores.map((c) => (
                    <button
                      key={c.nome}
                      type="button"
                      title={c.nome}
                      aria-label={`Cor ${c.nome}`}
                      aria-pressed={sel?.cor === c.nome}
                      className={'pet-cor' + (sel?.cor === c.nome ? ' ativa' : '')}
                      onClick={() => onCor(categoria, v, c.nome)}
                    >
                      {c.imagem ? <img src={imagemUrl(c.imagem)} alt="" /> : <span>{c.nome[0]}</span>}
                    </button>
                  ))}
                </div>
              )}
              {sel && extras(v, sel)}
              </div>
            </div>
          );
        })}
      </div>

      {zoom && <Lightbox src={zoom} onFechar={() => setZoom(null)} />}
    </div>
  );
}

export default function MontarPedido() {
  const { token } = useAuth();
  const { confirmar } = useDialog();
  const navigate = useNavigate();

  const [tipo, setTipo] = useState('model');
  const [catModel, setCatModel] = useState([]);
  const [catAvulso, setCatAvulso] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // model: lista de personagens { nome, selecoes: { varianteId: {quantidade, observacao} } }
  const [versoes, setVersoes] = useState([{ nome: '', selecoes: {} }]);
  // item avulso: um único conjunto de seleções
  const [selecoesAvulso, setSelecoesAvulso] = useState({});
  const [aceite, setAceite] = useState(false);
  const [abriuTermos, setAbriuTermos] = useState(false);
  const [prioritaria, setPrioritaria] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [fila, setFila] = useState(null); // { emFila, limite, cheia }

  useEffect(() => {
    api
      .get('/catalogo')
      .then((cats) => {
        setCatModel(cats.filter((c) => c.tipo === 'model'));
        setCatAvulso(cats.filter((c) => c.tipo === 'item_avulso'));
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  // Fila cheia bloqueia o envio de novos pedidos.
  useEffect(() => {
    api.get('/fila/status', token).then(setFila).catch(() => {});
  }, [token]);

  // Mapa varianteId -> variante (para estimativas).
  const varPorId = useMemo(() => {
    const m = {};
    [...catModel, ...catAvulso].forEach((c) =>
      c.variantes.forEach((v) => (m[v._id] = v))
    );
    return m;
  }, [catModel, catAvulso]);

  // ---- atualizadores genéricos sobre um objeto de seleções ----
  function novaSelecao(variante) {
    return {
      quantidade: 1,
      observacao: '',
      descricoes: [],
    };
  }
  function toggleEm(selecoes, categoria, variante) {
    const novo = { ...selecoes };
    if (novo[variante._id]) {
      delete novo[variante._id];
      return novo;
    }
    // seleção única: remove outras variantes da mesma categoria
    if (!categoria.permiteMultiplaSelecao) {
      categoria.variantes.forEach((v) => delete novo[v._id]);
    }
    novo[variante._id] = novaSelecao(variante);
    return novo;
  }
  // clicar numa cor: seleciona a variante (se preciso) e define a cor; clicar na cor já escolhida tira a cor
  // (volta a foto principal do item)
  function setCorEm(selecoes, categoria, variante, cor) {
    const novo = { ...selecoes };
    if (!novo[variante._id]) {
      if (!categoria.permiteMultiplaSelecao) categoria.variantes.forEach((v) => delete novo[v._id]);
      novo[variante._id] = novaSelecao(variante);
    }
    const igual = novo[variante._id].cor === cor;
    novo[variante._id] = { ...novo[variante._id], cor: igual ? undefined : cor };
    return novo;
  }
  function setDescricaoEm(selecoes, id, index, txt) {
    const sel = selecoes[id] || {};
    const descricoes = [...(sel.descricoes || [])];
    descricoes[index] = txt;
    return { ...selecoes, [id]: { ...sel, descricoes } };
  }

  // ---- model (por versão) ----
  function atualizarVersao(i, fn) {
    setVersoes((vs) => vs.map((v, idx) => (idx === i ? { ...v, selecoes: fn(v.selecoes) } : v)));
  }
  const toggleModel = (i) => (cat, v) => atualizarVersao(i, (s) => toggleEm(s, cat, v));
  const qtdModel = (i) => (id, q) =>
    atualizarVersao(i, (s) => ({ ...s, [id]: { ...s[id], quantidade: q } }));
  const obsModel = (i) => (id, txt) =>
    atualizarVersao(i, (s) => ({ ...s, [id]: { ...s[id], observacao: txt } }));
  const corModel = (i) => (cat, v, cor) => atualizarVersao(i, (s) => setCorEm(s, cat, v, cor));
  const descricaoModel = (i) => (id, idx, txt) => atualizarVersao(i, (s) => setDescricaoEm(s, id, idx, txt));

  function addVersao() {
    setVersoes((vs) => [...vs, { nome: '', selecoes: {} }]);
  }
  async function removerVersao(i) {
    const v = versoes[i];
    // só pergunta se o personagem já tem algo montado (evita fricção à toa)
    const temConteudo = v && (v.nome?.trim() || Object.keys(v.selecoes || {}).length > 0);
    if (temConteudo) {
      const ok = await confirmar({
        titulo: 'Remover personagem',
        mensagem: `Remover "${v.nome?.trim() || `Personagem ${i + 1}`}" e tudo o que você escolheu para ele?`,
        okLabel: 'Remover',
        cancelLabel: 'Voltar',
        perigo: true,
      });
      if (!ok) return;
    }
    setVersoes((vs) => vs.filter((_, idx) => idx !== i));
  }
  function renomearVersao(i, nome) {
    setVersoes((vs) => vs.map((v, idx) => (idx === i ? { ...v, nome } : v)));
  }

  // ---- item avulso ----
  const toggleAvulso = (cat, v) => setSelecoesAvulso((s) => toggleEm(s, cat, v));
  const qtdAvulso = (id, q) => setSelecoesAvulso((s) => ({ ...s, [id]: { ...s[id], quantidade: q } }));
  const obsAvulso = (id, txt) => setSelecoesAvulso((s) => ({ ...s, [id]: { ...s[id], observacao: txt } }));
  const corAvulso = (cat, v, cor) => setSelecoesAvulso((s) => setCorEm(s, cat, v, cor));
  const descricaoAvulso = (id, idx, txt) => setSelecoesAvulso((s) => setDescricaoEm(s, id, idx, txt));

  // ---- estimativa (soma das faixas das variantes escolhidas) ----
  const estimativa = useMemo(() => {
    let min = 0;
    let max = 0;
    const somar = (selecoes) => {
      Object.entries(selecoes).forEach(([id, sel]) => {
        const v = varPorId[id];
        if (!v) return;
        const q = sel.quantidade || 1;
        min += (v.precoMin || 0) * q;
        max += (v.precoMax || v.precoMin || 0) * q;
      });
    };
    if (tipo === 'model') versoes.forEach((v) => somar(v.selecoes));
    else somar(selecoesAvulso);
    if (prioritaria && (min || max)) {
      min += TAXA_ENTREGA_PRIORITARIA;
      max += TAXA_ENTREGA_PRIORITARIA;
    }
    return { min, max };
  }, [tipo, versoes, selecoesAvulso, varPorId, prioritaria]);

  const totalItens = useMemo(() => {
    const conta = (sel) => Object.keys(sel).length;
    return tipo === 'model' ? versoes.reduce((t, v) => t + conta(v.selecoes), 0) : conta(selecoesAvulso);
  }, [tipo, versoes, selecoesAvulso]);
  const textoEstimativa = estimativa.max
    ? `${formatBRL(estimativa.min)}${estimativa.max !== estimativa.min ? ' a ' + formatBRL(estimativa.max) : ''}`
    : '—';

  // Marcar entrega prioritária: explica as condições e pede confirmação.
  async function alternarPrioritaria(marcou) {
    if (!marcou) return setPrioritaria(false);
    const ok = await confirmar({
      titulo: 'Entrega prioritária',
      mensagem:
        `A entrega prioritária custa ${formatBRL(TAXA_ENTREGA_PRIORITARIA)} a mais que o valor normal do seu model.\n\n` +
        'Em troca, o seu pedido fura a fila e fica pronto em 3 a 5 dias úteis.\n\n' +
        'Quer mesmo a entrega prioritária?',
      okLabel: 'Sim, quero',
      cancelLabel: 'Não, obrigado',
    });
    setPrioritaria(ok);
  }

  // Monta o payload do pedido a partir das seleções atuais.
  function montarPayload() {
    const toItens = (selecoes) =>
      Object.entries(selecoes).map(([variante, sel]) => ({
        variante,
        quantidade: sel.quantidade,
        observacao: sel.observacao,
        cor: sel.cor,
        descricoes: (sel.descricoes || []).slice(0, sel.quantidade || 1).filter(Boolean),
      }));

    const payload = {
      tipo,
      aceiteTermo: { aceito: true },
      itensPersonalizados: [],
      entregaPrioritaria: prioritaria,
    };
    if (tipo === 'model') {
      payload.versoes = versoes
        .map((v, i) => ({ nome: v.nome?.trim() || `Personagem ${i + 1}`, itens: toItens(v.selecoes) }))
        .filter((v) => v.itens.length > 0);
    } else {
      payload.itensAvulsos = toItens(selecoesAvulso);
    }
    return { payload };
  }

  // Valida se há itens e nomes; retorna mensagem de erro ou null.
  function validarItens() {
    const { payload } = montarPayload();
    if (tipo === 'model') {
      if (!payload.versoes.length) {
        return 'Selecione pelo menos um item.';
      }
      const semNome = versoes.some(
        (v) => Object.keys(v.selecoes).length > 0 && !v.nome.trim()
      );
      if (semNome) return 'Dê um nome a cada personagem antes de enviar.';
    }
    if (tipo === 'item_avulso' && !payload.itensAvulsos.length) {
      return 'Selecione pelo menos um item avulso.';
    }
    return null;
  }

  // Botão principal: valida e abre o modal de termos.
  function revisarEEnviar() {
    const err = validarItens();
    if (err) return setErro(err);
    setErro('');
    setModalAberto(true);
  }

  async function enviar() {
    if (!aceite) return;
    setErro('');
    setEnviando(true);
    try {
      const { payload } = montarPayload();
      const pedido = await api.post('/pedidos', payload, token);
      navigate(`/pedido/${pedido._id}`);
    } catch (e) {
      setErro(e.message);
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <Layout>
        <p className="muted">Carregando catálogo...</p>
      </Layout>
    );
  }

  const categorias = tipo === 'model' ? catModel : catAvulso;

  return (
    <Layout>
      <Cabecalho titulo="Fazer pedido" subtitulo="Escolha as partes do seu personagem, categoria por categoria. O artista confere tudo e envia o orçamento." />

      <div className="btn-row" style={{ marginBottom: 16 }}>
        <button
          className={tipo === 'model' ? '' : 'secundario'}
          onClick={() => setTipo('model')}
        >
          Model (personagem)
        </button>
        <button
          className={tipo === 'item_avulso' ? '' : 'secundario'}
          onClick={() => setTipo('item_avulso')}
        >
          Item avulso (espada, cajado, escudo)
        </button>
      </div>

      {tipo === 'model' ? (
        <>
          <p className="muted">
            Dê um nome ao seu personagem e monte as partes dele abaixo. Se quiser, dá pra
            encomendar mais de um personagem no mesmo pedido.
          </p>

          {versoes.map((versao, i) => (
            <div className="card versao-card" key={i}>
              <div className="between" style={{ marginBottom: 12, alignItems: 'flex-end' }}>
                <label style={{ flex: 1, maxWidth: 340 }}>
                  Nome do personagem <span className="muted" style={{ fontWeight: 400 }}>(obrigatório)</span>
                  <input
                    value={versao.nome}
                    placeholder="Ex: Aelthorn, o mago"
                    onChange={(e) => renomearVersao(i, e.target.value)}
                    style={{ fontWeight: 700 }}
                  />
                </label>
                {versoes.length > 1 && (
                  <button className="secundario pequeno" onClick={() => removerVersao(i)}>
                    Remover personagem
                  </button>
                )}
              </div>
              <PassosCategorias
                categorias={catModel}
                renderCategoria={(cat, aoEscolher) => (
                  <CategoriaBloco
                    key={cat._id}
                    categoria={cat}
                    selecoes={versao.selecoes}
                    onToggle={(c, v) => {
                      const ficara = !versao.selecoes[v._id];
                      toggleModel(i)(c, v);
                      aoEscolher(c, ficara);
                    }}
                    onQtd={qtdModel(i)}
                    onObs={obsModel(i)}
                    onCor={corModel(i)}
                    onDescricao={descricaoModel(i)}
                  />
                )}
              />
            </div>
          ))}

          <button className="secundario" onClick={addVersao} style={{ marginTop: 12 }}>
            + Adicionar outro personagem
          </button>
        </>
      ) : (
        <>
          <p className="muted">
            Itens avulsos são produzidos como um pedido separado do model.
          </p>
          <div className="card">
            <PassosCategorias
              categorias={catAvulso}
              renderCategoria={(cat, aoEscolher) => (
                <CategoriaBloco
                  key={cat._id}
                  categoria={cat}
                  selecoes={selecoesAvulso}
                  onToggle={(c, v) => {
                    const ficara = !selecoesAvulso[v._id];
                    toggleAvulso(c, v);
                    aoEscolher(c, ficara);
                  }}
                  onQtd={qtdAvulso}
                  onObs={obsAvulso}
                  onCor={corAvulso}
                  onDescricao={descricaoAvulso}
                />
              )}
            />
          </div>
        </>
      )}

      {/* Entrega prioritária */}
      <div className="card" style={{ marginTop: 16 }}>
        <label className="pill-check">
          <input
            type="checkbox"
            checked={prioritaria}
            onChange={(e) => alternarPrioritaria(e.target.checked)}
          />
          <span>
            <Icone nome="raio" /> <strong>Entrega prioritária</strong> — fica pronto em <strong>3 a 5 dias úteis</strong>{' '}
            por <strong>{formatBRL(TAXA_ENTREGA_PRIORITARIA)}</strong> a mais
          </span>
        </label>
        <p className="muted" style={{ fontSize: 15, margin: '6px 0 0' }}>
          Sem a prioridade, o prazo normal é de 20 a 45 dias, conforme a fila.
        </p>
      </div>

      {/* Estimativa */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="between">
          <span className="muted">Estimativa (referência)</span>
          <span className="preco" style={{ fontSize: 22 }}>{textoEstimativa}</span>
        </div>
        <p className="muted" style={{ fontSize: 15, margin: '6px 0 0' }}>
          O valor final é definido pelo artista no orçamento.
        </p>

        {erro && <p className="erro">{erro}</p>}

        {fila?.cheia && (
          <div className="aviso" style={{ marginTop: 12 }}>
            <Icone nome="aviso" /> <strong>A fila está cheia no momento</strong> (máximo de {fila.limite} pedidos em
            produção ao mesmo tempo). Não é possível enviar um novo pedido agora — volte em breve,
            assim que o artista liberar uma vaga.
          </div>
        )}

      </div>

      {/* Barra de resumo: sempre à vista, no polegar do celular */}
      <div className="resumo-fixo">
        <div className="resumo-barra">
            <div className="resumo-info">
              <span className="resumo-itens">
                {totalItens === 0 ? 'Nenhum item ainda' : `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`}
              </span>
              <span className="resumo-valor">{textoEstimativa}</span>
            </div>
            <button
              onClick={revisarEEnviar}
              disabled={fila?.cheia}
              title={fila?.cheia ? 'A fila está cheia no momento' : undefined}
            >
              Revisar e enviar
            </button>
        </div>
      </div>

      <Modal
        aberto={modalAberto}
        titulo="Antes de enviar — Termos do pedido"
        onFechar={() => !enviando && setModalAberto(false)}
        footer={
          <>
            <button className="secundario" onClick={() => setModalAberto(false)} disabled={enviando}>
              Cancelar
            </button>
            <button onClick={enviar} disabled={!aceite || enviando}>
              {enviando ? 'Enviando...' : 'Confirmar e enviar'}
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          Leia o documento de termos e condições antes de enviar o seu pedido:
        </p>

        <a
          href={TERMOS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="botao-link"
          onClick={() => setAbriuTermos(true)}
        >
          <Icone nome="documento" /> Ler os termos e condições {abriuTermos && <Icone nome="check" />}
        </a>

        <div className="aviso" style={{ marginTop: 14 }}>
          <strong>Importante:</strong> a leitura dos termos é de <strong>total responsabilidade
          sua</strong>. Se você marcar o aceite sem ler o documento, assume total responsabilidade
          por isso.
        </div>

        <label className="pill-check" style={{ marginTop: 14, opacity: abriuTermos ? 1 : 0.5 }}>
          <input
            type="checkbox"
            checked={aceite}
            disabled={!abriuTermos}
            onChange={(e) => setAceite(e.target.checked)}
          />
          <span>Li os termos e condições e aceito.</span>
        </label>
        {!abriuTermos && (
          <p className="muted" style={{ fontSize: 16, marginTop: 4 }}>
            Abra os termos acima para poder marcar o aceite.
          </p>
        )}
        {erro && <p className="erro">{erro}</p>}
      </Modal>
    </Layout>
  );
}
