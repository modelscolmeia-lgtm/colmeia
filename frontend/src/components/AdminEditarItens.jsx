import { useMemo, useState } from 'react';
import { api } from '../services/api';
import ItemImagem from './ItemImagem';

// Editor de itens de um pedido (usado pelo admin, antes do pagamento).
// `catalogo` = categorias (com variantes) do tipo do pedido.
export default function AdminEditarItens({ pedido, token, catalogo, onSalvo, onCancelar }) {
  const toItem = (it) => ({
    varianteId: it.variante?._id || null,
    nome: it.variante?.nome || '(variante removida)',
    img: it.variante?.imagemExemplo || '',
    quantidade: it.quantidade || 1,
    observacao: it.observacao || '',
  });

  const [chars, setChars] = useState(() =>
    (pedido.versoes || []).map((v) => ({ nome: v.nome || '', itens: (v.itens || []).map(toItem) }))
  );
  const [avulsos, setAvulsos] = useState(() => (pedido.itensAvulsos || []).map(toItem));
  const [pers, setPers] = useState(() =>
    (pedido.itensPersonalizados || []).map((ip) => ({ tipo: ip.tipo || 'Item Específico', descricao: ip.descricao || '', valor: ip.valor ?? '' }))
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const flat = useMemo(
    () => (catalogo || []).flatMap((c) => c.variantes.map((v) => ({ id: v._id, nome: v.nome, img: v.imagemExemplo || '', cat: c.nome }))),
    [catalogo]
  );
  const dadosDe = (id) => flat.find((o) => o.id === id) || {};

  // ---- model (personagens) ----
  const setChar = (ci, fn) => setChars((cs) => cs.map((c, i) => (i === ci ? fn(c) : c)));
  const renomear = (ci, nome) => setChar(ci, (c) => ({ ...c, nome }));
  const removerChar = (ci) => setChars((cs) => cs.filter((_, i) => i !== ci));
  const addChar = () => setChars((cs) => [...cs, { nome: '', itens: [] }]);
  const setItemChar = (ci, ii, fn) => setChar(ci, (c) => ({ ...c, itens: c.itens.map((it, i) => (i === ii ? fn(it) : it)) }));
  const removerItemChar = (ci, ii) => setChar(ci, (c) => ({ ...c, itens: c.itens.filter((_, i) => i !== ii) }));
  const addItemChar = (ci, id) => {
    if (!id) return;
    const d = dadosDe(id);
    setChar(ci, (c) => ({ ...c, itens: [...c.itens, { varianteId: id, nome: d.nome || '', img: d.img || '', quantidade: 1, observacao: '' }] }));
  };

  // ---- avulsos ----
  const setAvulso = (ii, fn) => setAvulsos((a) => a.map((it, i) => (i === ii ? fn(it) : it)));
  const removerAvulso = (ii) => setAvulsos((a) => a.filter((_, i) => i !== ii));
  const addAvulso = (id) => {
    if (!id) return;
    const d = dadosDe(id);
    setAvulsos((a) => [...a, { varianteId: id, nome: d.nome || '', img: d.img || '', quantidade: 1, observacao: '' }]);
  };

  // ---- personalizados ----
  const setPer = (i, fn) => setPers((p) => p.map((x, idx) => (idx === i ? fn(x) : x)));
  const removerPer = (i) => setPers((p) => p.filter((_, idx) => idx !== i));
  const addPer = () => setPers((p) => [...p, { tipo: 'Item Específico', descricao: '', valor: '' }]);

  function SelectAdd({ onAdd }) {
    return (
      <select
        value=""
        onChange={(e) => { onAdd(e.target.value); e.target.value = ''; }}
        style={{ maxWidth: 260 }}
      >
        <option value="">+ Adicionar item...</option>
        {catalogo.map((c) => (
          <optgroup key={c._id} label={c.nome}>
            {c.variantes.map((v) => (
              <option key={v._id} value={v._id}>{v.nome}</option>
            ))}
          </optgroup>
        ))}
      </select>
    );
  }

  function LinhaItem({ it, onQtd, onObs, onRemover }) {
    return (
      <div className="row" style={{ gap: 8, marginBottom: 6 }}>
        <ItemImagem url={it.img} size={36} />
        <span style={{ flex: 1, minWidth: 100 }}>{it.nome}</span>
        <input className="input-sm" type="number" min={1} value={it.quantidade} onChange={(e) => onQtd(Math.max(1, Number(e.target.value) || 1))} />
        <input placeholder="obs" value={it.observacao} onChange={(e) => onObs(e.target.value)} style={{ flex: 1, minWidth: 100 }} />
        <button className="perigo pequeno" onClick={onRemover}>×</button>
      </div>
    );
  }

  async function salvar() {
    setSalvando(true);
    setErro('');
    try {
      const payload = {
        itensPersonalizados: pers
          .filter((p) => p.descricao.trim())
          .map((p) => ({ tipo: p.tipo, descricao: p.descricao, valor: p.valor === '' ? undefined : Number(p.valor) })),
      };
      if (pedido.tipo === 'model') {
        payload.versoes = chars.map((c) => ({
          nome: c.nome,
          itens: c.itens.filter((it) => it.varianteId).map((it) => ({ variante: it.varianteId, quantidade: it.quantidade, observacao: it.observacao })),
        }));
      } else {
        payload.itensAvulsos = avulsos
          .filter((it) => it.varianteId)
          .map((it) => ({ variante: it.varianteId, quantidade: it.quantidade, observacao: it.observacao }));
      }
      await api.put(`/admin/pedidos/${pedido._id}/itens`, payload, token);
      onSalvo();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="card" style={{ background: 'var(--card-2)', marginTop: 12 }}>
      <h4 style={{ marginTop: 0 }}>Editar itens do pedido</h4>
      <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
        Ao salvar, o pedido volta para "aguardando aprovação" e precisa ser reorçado.
      </p>

      {pedido.tipo === 'model' ? (
        <>
          {chars.map((c, ci) => (
            <div className="card" key={ci} style={{ marginBottom: 10 }}>
              <div className="between" style={{ marginBottom: 8 }}>
                <input placeholder="Nome do personagem" value={c.nome} onChange={(e) => renomear(ci, e.target.value)} style={{ fontWeight: 700, maxWidth: 260 }} />
                <button className="secundario pequeno" onClick={() => removerChar(ci)}>Remover personagem</button>
              </div>
              {c.itens.map((it, ii) => (
                <LinhaItem
                  key={ii}
                  it={it}
                  onQtd={(q) => setItemChar(ci, ii, (x) => ({ ...x, quantidade: q }))}
                  onObs={(t) => setItemChar(ci, ii, (x) => ({ ...x, observacao: t }))}
                  onRemover={() => removerItemChar(ci, ii)}
                />
              ))}
              <SelectAdd onAdd={(id) => addItemChar(ci, id)} />
            </div>
          ))}
          <button className="secundario pequeno" onClick={addChar}>+ Adicionar personagem</button>
        </>
      ) : (
        <div className="card" style={{ marginBottom: 10 }}>
          {avulsos.map((it, ii) => (
            <LinhaItem
              key={ii}
              it={it}
              onQtd={(q) => setAvulso(ii, (x) => ({ ...x, quantidade: q }))}
              onObs={(t) => setAvulso(ii, (x) => ({ ...x, observacao: t }))}
              onRemover={() => removerAvulso(ii)}
            />
          ))}
          <SelectAdd onAdd={addAvulso} />
        </div>
      )}

      {/* personalizados */}
      <div style={{ marginTop: 8 }}>
        <strong>Itens personalizados</strong>
        {pers.map((p, i) => (
          <div className="row" key={i} style={{ gap: 8, marginTop: 6 }}>
            <input placeholder="tipo" value={p.tipo} onChange={(e) => setPer(i, (x) => ({ ...x, tipo: e.target.value }))} style={{ width: 150 }} />
            <input placeholder="descrição" value={p.descricao} onChange={(e) => setPer(i, (x) => ({ ...x, descricao: e.target.value }))} style={{ flex: 1, minWidth: 120 }} />
            <button className="perigo pequeno" onClick={() => removerPer(i)}>×</button>
          </div>
        ))}
        <button className="secundario pequeno" onClick={addPer} style={{ marginTop: 8 }}>+ Adicionar personalizado</button>
      </div>

      {erro && <p className="erro">{erro}</p>}
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar itens'}</button>
        <button className="secundario" onClick={onCancelar} disabled={salvando}>Cancelar</button>
      </div>
    </div>
  );
}
