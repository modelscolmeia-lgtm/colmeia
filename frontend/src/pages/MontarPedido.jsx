import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  faixaPreco,
  formatBRL,
  imagemUrl,
  ITENS_PERSONALIZADOS,
  TERMOS,
  TERMOS_URL,
} from '../utils/pedido';

// Renderiza uma categoria com suas variantes selecionáveis.
function CategoriaBloco({ categoria, selecoes, onToggle, onQtd, onObs, onCor, onDescricao }) {
  const multipla = categoria.permiteMultiplaSelecao;
  const textoQtd = categoria.textoPorQuantidade; // um texto por unidade (ex: expressões)
  const [zoom, setZoom] = useState(null);

  const comCores = categoria.variantes.filter((v) => v.cores?.length > 0);
  const semCores = categoria.variantes.filter((v) => !(v.cores?.length > 0));

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
        <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>
          ({multipla ? 'pode escolher várias' : 'escolha uma'})
        </span>
      </h4>

      {/* variantes normais — em linha */}
      {semCores.map((v) => {
        const sel = selecoes[v._id];
        return (
          <div key={v._id}>
            <div className={'opcao' + (sel ? ' selecionada' : '')} onClick={() => onToggle(categoria, v)}>
              <input type={multipla ? 'checkbox' : 'radio'} checked={!!sel} readOnly />
              {v.imagemExemplo && (
                <img
                  className="opcao-thumb"
                  src={imagemUrl(v.imagemExemplo)}
                  alt={v.nome}
                  title="Clique para ampliar"
                  onClick={(e) => { e.stopPropagation(); setZoom(imagemUrl(v.imagemExemplo)); }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <span className="nome">{v.nome}</span>
              <span className="faixa">{faixaPreco(v)}</span>
            </div>
            {sel && <div style={{ margin: '0 0 10px 28px' }}>{extras(v, sel)}</div>}
          </div>
        );
      })}

      {/* variantes com cores — cards grandes (estilo pet), com quadradinhos de cor */}
      {comCores.length > 0 && (
        <div className="pet-grid">
          {comCores.map((v) => {
            const sel = selecoes[v._id];
            const corAtual = v.cores.find((c) => c.nome === sel?.cor) || v.cores[0];
            const imgAtual = corAtual?.imagem || v.imagemExemplo;
            return (
              <div
                key={v._id}
                className={'pet-card' + (sel ? ' selecionada' : '')}
                onClick={() => onToggle(categoria, v)}
              >
                <div className="pet-card-img">
                  {imgAtual ? (
                    <img src={imagemUrl(imgAtual)} alt={v.nome} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <span className="muted" style={{ fontSize: 13 }}>sem imagem</span>
                  )}
                </div>
                <div className="pet-card-info">
                  <span className="nome">{v.nome}</span>
                  <span className="faixa">{faixaPreco(v)}</span>
                </div>
                {/* quadradinhos de cor: clicar troca a imagem do quadrado grande */}
                <div className="pet-cores" onClick={(e) => e.stopPropagation()}>
                  {v.cores.map((c) => (
                    <button
                      key={c.nome}
                      type="button"
                      title={c.nome}
                      className={'pet-cor' + (sel?.cor === c.nome ? ' ativa' : '')}
                      onClick={() => onCor(categoria, v, c.nome)}
                    >
                      {c.imagem ? <img src={imagemUrl(c.imagem)} alt={c.nome} /> : <span>{c.nome[0]}</span>}
                    </button>
                  ))}
                </div>
                {sel && extras(v, sel)}
              </div>
            );
          })}
        </div>
      )}

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" />
          <button className="lightbox-fechar" onClick={() => setZoom(null)} aria-label="Fechar">✕</button>
        </div>
      )}
    </div>
  );
}

export default function MontarPedido() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [tipo, setTipo] = useState('model');
  const [catModel, setCatModel] = useState([]);
  const [catAvulso, setCatAvulso] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // model: lista de personagens { nome, selecoes: { varianteId: {quantidade, observacao} } }
  const [versoes, setVersoes] = useState([{ nome: '', selecoes: {} }]);
  // item avulso: um único conjunto de seleções
  const [selecoesAvulso, setSelecoesAvulso] = useState({});
  const [personalizados, setPersonalizados] = useState({});
  const [aceite, setAceite] = useState(false);
  const [abriuTermos, setAbriuTermos] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

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
      cor: variante.cores?.length ? variante.cores[0].nome : undefined,
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
  // clicar numa cor: seleciona a variante (se preciso) e define a cor
  function setCorEm(selecoes, categoria, variante, cor) {
    const novo = { ...selecoes };
    if (!novo[variante._id]) {
      if (!categoria.permiteMultiplaSelecao) categoria.variantes.forEach((v) => delete novo[v._id]);
      novo[variante._id] = novaSelecao(variante);
    }
    novo[variante._id] = { ...novo[variante._id], cor };
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
  function removerVersao(i) {
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
    return { min, max };
  }, [tipo, versoes, selecoesAvulso, varPorId]);

  function setPersonalizado(tipoItem, descricao) {
    setPersonalizados((p) => ({ ...p, [tipoItem]: descricao }));
  }

  // Monta o payload do pedido a partir das seleções atuais.
  function montarPayload() {
    const personalizadosArr = ITENS_PERSONALIZADOS.filter((i) => personalizados[i.tipo]?.trim()).map(
      (i) => ({ tipo: i.tipo, descricao: personalizados[i.tipo].trim() })
    );
    const toItens = (selecoes) =>
      Object.entries(selecoes).map(([variante, sel]) => ({
        variante,
        quantidade: sel.quantidade,
        observacao: sel.observacao,
        cor: sel.cor,
        descricoes: (sel.descricoes || []).slice(0, sel.quantidade || 1).filter(Boolean),
      }));

    const payload = { tipo, aceiteTermo: { aceito: true }, itensPersonalizados: personalizadosArr };
    if (tipo === 'model') {
      payload.versoes = versoes
        .map((v, i) => ({ nome: v.nome?.trim() || `Personagem ${i + 1}`, itens: toItens(v.selecoes) }))
        .filter((v) => v.itens.length > 0);
    } else {
      payload.itensAvulsos = toItens(selecoesAvulso);
    }
    return { payload, personalizadosArr };
  }

  // Valida se há itens e nomes; retorna mensagem de erro ou null.
  function validarItens() {
    const { payload, personalizadosArr } = montarPayload();
    if (tipo === 'model') {
      if (!payload.versoes.length && !personalizadosArr.length) {
        return 'Selecione pelo menos um item ou descreva um item personalizado.';
      }
      const semNome = versoes.some(
        (v) => Object.keys(v.selecoes).length > 0 && !v.nome.trim()
      );
      if (semNome) return 'Dê um nome a cada personagem antes de enviar.';
    }
    if (tipo === 'item_avulso' && !payload.itensAvulsos.length && !personalizadosArr.length) {
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
      <h1>Montar pedido</h1>

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
              {catModel.map((cat) => (
                <CategoriaBloco
                  key={cat._id}
                  categoria={cat}
                  selecoes={versao.selecoes}
                  onToggle={toggleModel(i)}
                  onQtd={qtdModel(i)}
                  onObs={obsModel(i)}
                  onCor={corModel(i)}
                  onDescricao={descricaoModel(i)}
                />
              ))}
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
            {catAvulso.map((cat) => (
              <CategoriaBloco
                key={cat._id}
                categoria={cat}
                selecoes={selecoesAvulso}
                onToggle={toggleAvulso}
                onQtd={qtdAvulso}
                onObs={obsAvulso}
                onCor={corAvulso}
                onDescricao={descricaoAvulso}
              />
            ))}
          </div>
        </>
      )}

      {/* Itens personalizados (texto livre) */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Quer algo fora do catálogo?</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Descreva e o artista define o valor no orçamento.
        </p>
        <div className="stack">
          {ITENS_PERSONALIZADOS.map((item) => (
            <label key={item.tipo}>
              {item.tipo} <span className="muted">— {item.dica}</span>
              <input
                placeholder={item.placeholder}
                value={personalizados[item.tipo] || ''}
                onChange={(e) => setPersonalizado(item.tipo, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Estimativa */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="between">
          <span className="muted">Estimativa (referência)</span>
          <span className="preco" style={{ fontSize: 22 }}>
            {estimativa.max
              ? `${formatBRL(estimativa.min)}${estimativa.max !== estimativa.min ? ' a ' + formatBRL(estimativa.max) : ''}`
              : '—'}
          </span>
        </div>
        <p className="muted" style={{ fontSize: 15, margin: '6px 0 0' }}>
          O valor final é definido pelo artista no orçamento e pode incluir itens personalizados.
        </p>

        {erro && <p className="erro">{erro}</p>}

        <button onClick={revisarEEnviar} style={{ marginTop: 14 }}>
          Revisar e enviar pedido
        </button>
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
          Antes de enviar, é <strong>obrigatório ler</strong> o documento completo de termos e
          condições. Abra o link abaixo:
        </p>

        <button
          type="button"
          className={abriuTermos ? 'secundario' : ''}
          onClick={() => {
            window.open(TERMOS_URL, '_blank', 'noopener,noreferrer');
            setAbriuTermos(true);
          }}
        >
          📄 Ler os termos e condições {abriuTermos ? '✓' : ''}
        </button>

        <details style={{ marginTop: 14 }}>
          <summary className="muted" style={{ cursor: 'pointer' }}>Resumo dos principais pontos</summary>
          {TERMOS.map((t) => (
            <div className="termo-item" key={t.titulo} style={{ marginTop: 8 }}>
              <strong>{t.titulo}</strong>
              <div style={{ marginTop: 4 }}>{t.texto}</div>
            </div>
          ))}
        </details>

        <div className="aviso" style={{ marginTop: 14 }}>
          <strong>Importante:</strong> a leitura dos termos é responsabilidade sua. Se você não
          ler o documento, o artista não se responsabiliza por desentendimentos sobre o que foi
          combinado.
        </div>

        <label className="pill-check" style={{ marginTop: 14, opacity: abriuTermos ? 1 : 0.5 }}>
          <input
            type="checkbox"
            checked={aceite}
            disabled={!abriuTermos}
            onChange={(e) => setAceite(e.target.checked)}
          />
          <span>
            Li o documento de termos e condições e aceito. Estou ciente de que a leitura é minha
            responsabilidade.
          </span>
        </label>
        {!abriuTermos && (
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            Abra o documento acima para poder marcar o aceite.
          </p>
        )}
        {erro && <p className="erro">{erro}</p>}
      </Modal>
    </Layout>
  );
}
