import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { imagemUrl } from '../utils/pedido';

// Botão que abre o seletor de arquivo e faz upload; devolve a URL via onUrl.
function UploadBtn({ token, onUrl, label = 'Enviar imagem' }) {
  const inputRef = useRef(null);
  const [enviando, setEnviando] = useState(false);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnviando(true);
    try {
      const { url } = await api.upload('/admin/upload', file, token);
      onUrl(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <button type="button" className="secundario pequeno" onClick={() => inputRef.current?.click()} disabled={enviando}>
        {enviando ? 'Enviando...' : label}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
    </>
  );
}

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Miniatura da variante (imagem de exemplo) com fallback.
function Thumb({ url, size = 48 }) {
  if (!url) {
    return (
      <div
        style={{
          width: size, height: size, flex: 'none',
          border: '2px solid var(--field-border)', background: 'var(--card-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--muted)', fontSize: 12,
        }}
        title="Sem imagem"
      >
        s/img
      </div>
    );
  }
  return (
    <img
      src={imagemUrl(url)}
      alt=""
      style={{ width: size, height: size, objectFit: 'cover', border: '2px solid var(--field-border)', flex: 'none' }}
      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
    />
  );
}

// Linha editável de uma variante.
function VarianteRow({ variante, token, onMudou }) {
  const [v, setV] = useState(variante);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (campo, val) => setV((x) => ({ ...x, [campo]: val }));

  useEffect(() => setV(variante), [variante]);

  // cores (troca a imagem no montador — ex: pets prontos)
  const cores = v.cores || [];
  const setCor = (i, campo, val) => setV((x) => ({ ...x, cores: (x.cores || []).map((c, idx) => (idx === i ? { ...c, [campo]: val } : c)) }));
  const addCor = () => setV((x) => ({ ...x, cores: [...(x.cores || []), { nome: '', imagem: '' }] }));
  const removerCor = (i) => setV((x) => ({ ...x, cores: (x.cores || []).filter((_, idx) => idx !== i) }));

  async function salvar() {
    setSalvando(true);
    setMsg('');
    try {
      await api.put(
        `/admin/variantes/${v._id}`,
        {
          nome: v.nome,
          precoMin: Number(v.precoMin) || 0,
          precoMax: v.precoMax === '' || v.precoMax == null ? null : Number(v.precoMax),
          descricao: v.descricao || '',
          imagemExemplo: v.imagemExemplo || '',
          cores: (v.cores || []).filter((c) => c.nome?.trim()).map((c) => ({ nome: c.nome.trim(), imagem: c.imagem || '' })),
          ativo: !!v.ativo,
        },
        token
      );
      setMsg('✓ salvo');
      onMudou();
      setTimeout(() => setMsg(''), 1500);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="card"
      style={{ background: 'var(--card-2)', marginBottom: 10, opacity: v.ativo ? 1 : 0.55 }}
    >
      <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
        <Thumb url={v.imagemExemplo} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="row" style={{ gap: 8 }}>
            <label style={{ flex: 1, minWidth: 140 }}>
              Nome
              <input value={v.nome || ''} onChange={(e) => set('nome', e.target.value)} />
            </label>
            <label style={{ width: 90 }}>
              Preço mín.
              <input type="number" min={0} step="0.01" value={v.precoMin ?? ''} onChange={(e) => set('precoMin', e.target.value)} />
            </label>
            <label style={{ width: 90 }}>
              Preço máx.
              <input type="number" min={0} step="0.01" placeholder="fixo" value={v.precoMax ?? ''} onChange={(e) => set('precoMax', e.target.value)} />
            </label>
          </div>
          <label style={{ marginTop: 8 }}>
            Imagem (cole uma URL ou envie um arquivo)
            <div className="row" style={{ gap: 8 }}>
              <input style={{ flex: 1, minWidth: 160 }} placeholder="https://... ou /uploads/..." value={v.imagemExemplo || ''} onChange={(e) => set('imagemExemplo', e.target.value)} />
              <UploadBtn token={token} onUrl={(url) => set('imagemExemplo', url)} />
            </div>
          </label>
          <label style={{ marginTop: 8 }}>
            Descrição
            <input value={v.descricao || ''} onChange={(e) => set('descricao', e.target.value)} />
          </label>

          {/* Cores: cada uma tem imagem própria; no montador, trocar a cor troca a imagem. */}
          <div style={{ marginTop: 10 }}>
            <strong style={{ fontSize: 15 }}>Cores</strong>{' '}
            <span className="muted" style={{ fontSize: 13 }}>(opcional — ex: pets prontos; trocar a cor troca a imagem)</span>
            {cores.map((c, i) => (
              <div className="row" key={i} style={{ gap: 8, marginTop: 6 }}>
                <Thumb url={c.imagem} size={36} />
                <input placeholder="cor (ex: Azul)" value={c.nome || ''} onChange={(e) => setCor(i, 'nome', e.target.value)} style={{ width: 120 }} />
                <input placeholder="imagem (URL ou /uploads/...)" value={c.imagem || ''} onChange={(e) => setCor(i, 'imagem', e.target.value)} style={{ flex: 1, minWidth: 140 }} />
                <UploadBtn token={token} onUrl={(url) => setCor(i, 'imagem', url)} label="Imagem" />
                <button className="perigo pequeno" onClick={() => removerCor(i)}>×</button>
              </div>
            ))}
            <button className="secundario pequeno" onClick={addCor} style={{ marginTop: 6 }}>+ Adicionar cor</button>
          </div>

          <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
            <label className="pill-check" style={{ fontSize: 16 }}>
              <input type="checkbox" checked={!!v.ativo} onChange={(e) => set('ativo', e.target.checked)} />
              <span>Ativa (aparece no catálogo)</span>
            </label>
            <div className="row">
              {msg && <span className={msg.startsWith('✓') ? 'ok' : 'erro'} style={{ fontSize: 15 }}>{msg}</span>}
              <button className="pequeno" onClick={salvar} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Formulário para adicionar uma variante nova a uma categoria.
function NovaVariante({ categoriaId, token, onCriado }) {
  const vazio = { nome: '', precoMin: '', precoMax: '', imagemExemplo: '', descricao: '' };
  const [form, setForm] = useState(vazio);
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const set = (c, val) => setForm((f) => ({ ...f, [c]: val }));

  async function criar() {
    if (!form.nome.trim()) return setErro('Dê um nome à variante');
    setSalvando(true);
    setErro('');
    try {
      await api.post(
        '/admin/variantes',
        {
          categoria: categoriaId,
          nome: form.nome.trim(),
          precoMin: Number(form.precoMin) || 0,
          precoMax: form.precoMax === '' ? null : Number(form.precoMax),
          imagemExemplo: form.imagemExemplo.trim(),
          descricao: form.descricao.trim(),
          ativo: true,
        },
        token
      );
      setForm(vazio);
      setAberto(false);
      onCriado();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <button className="secundario pequeno" onClick={() => setAberto(true)}>
        + Adicionar variante
      </button>
    );
  }

  return (
    <div className="card" style={{ background: 'var(--card-2)', marginTop: 8 }}>
      <div className="row" style={{ gap: 8 }}>
        <label style={{ flex: 1, minWidth: 140 }}>
          Nome
          <input value={form.nome} onChange={(e) => set('nome', e.target.value)} />
        </label>
        <label style={{ width: 90 }}>
          Preço mín.
          <input type="number" min={0} step="0.01" value={form.precoMin} onChange={(e) => set('precoMin', e.target.value)} />
        </label>
        <label style={{ width: 90 }}>
          Preço máx.
          <input type="number" min={0} step="0.01" placeholder="fixo" value={form.precoMax} onChange={(e) => set('precoMax', e.target.value)} />
        </label>
      </div>
      <label style={{ marginTop: 8 }}>
        Imagem (opcional — URL ou arquivo)
        <div className="row" style={{ gap: 8 }}>
          <input style={{ flex: 1, minWidth: 160 }} placeholder="https://... ou /uploads/..." value={form.imagemExemplo} onChange={(e) => set('imagemExemplo', e.target.value)} />
          <UploadBtn token={token} onUrl={(url) => set('imagemExemplo', url)} />
        </div>
      </label>
      {erro && <p className="erro">{erro}</p>}
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button className="pequeno" onClick={criar} disabled={salvando}>{salvando ? 'Criando...' : 'Criar variante'}</button>
        <button className="secundario pequeno" onClick={() => { setAberto(false); setErro(''); }}>Cancelar</button>
      </div>
    </div>
  );
}

// Formulário para criar uma categoria nova.
function NovaCategoria({ token, onCriado }) {
  const vazio = { nome: '', tipo: 'model', ordem: 99, permiteMultiplaSelecao: false, permiteQuantidade: false };
  const [form, setForm] = useState(vazio);
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const set = (c, val) => setForm((f) => ({ ...f, [c]: val }));

  async function criar() {
    if (!form.nome.trim()) return setErro('Dê um nome à categoria');
    setSalvando(true);
    setErro('');
    try {
      await api.post(
        '/admin/categorias',
        {
          nome: form.nome.trim(),
          slug: slugify(form.nome),
          tipo: form.tipo,
          ordem: Number(form.ordem) || 0,
          permiteMultiplaSelecao: form.permiteMultiplaSelecao,
          permiteQuantidade: form.permiteQuantidade,
        },
        token
      );
      setForm(vazio);
      setAberto(false);
      onCriado();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return <button onClick={() => setAberto(true)}>+ Nova categoria</button>;
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Nova categoria</h3>
      <div className="row" style={{ gap: 8 }}>
        <label style={{ flex: 1, minWidth: 160 }}>
          Nome
          <input value={form.nome} onChange={(e) => set('nome', e.target.value)} />
        </label>
        <label style={{ width: 160 }}>
          Tipo
          <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
            <option value="model">Model</option>
            <option value="item_avulso">Item avulso</option>
          </select>
        </label>
        <label style={{ width: 90 }}>
          Ordem
          <input type="number" value={form.ordem} onChange={(e) => set('ordem', e.target.value)} />
        </label>
      </div>
      <div className="row" style={{ marginTop: 10, gap: 20 }}>
        <label className="pill-check" style={{ fontSize: 16 }}>
          <input type="checkbox" checked={form.permiteMultiplaSelecao} onChange={(e) => set('permiteMultiplaSelecao', e.target.checked)} />
          <span>Permite escolher várias</span>
        </label>
        <label className="pill-check" style={{ fontSize: 16 }}>
          <input type="checkbox" checked={form.permiteQuantidade} onChange={(e) => set('permiteQuantidade', e.target.checked)} />
          <span>Permite quantidade</span>
        </label>
      </div>
      {erro && <p className="erro">{erro}</p>}
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button onClick={criar} disabled={salvando}>{salvando ? 'Criando...' : 'Criar categoria'}</button>
        <button className="secundario" onClick={() => { setAberto(false); setErro(''); }}>Cancelar</button>
      </div>
    </div>
  );
}

// Seção de categorias (Model ou Itens avulsos).
function Secao({ titulo, categorias, token, onMudou }) {
  if (!categorias.length) return null;
  return (
    <>
      <h2 style={{ marginTop: 24 }}>{titulo}</h2>
      {categorias.map((cat) => (
        <div className="card" key={cat._id}>
          <div className="between">
            <h3 style={{ margin: 0 }}>
              {cat.nome} <span className="badge info">{cat.variantes.length} variantes</span>
            </h3>
            <span className="muted" style={{ fontSize: 14 }}>
              slug: {cat.slug} · ordem {cat.ordem} · {cat.permiteMultiplaSelecao ? 'múltipla' : 'única'}
              {cat.permiteQuantidade ? ' · qtd' : ''}
            </span>
          </div>
          <hr className="divider" />
          {cat.variantes.map((v) => (
            <VarianteRow key={v._id} variante={v} token={token} onMudou={onMudou} />
          ))}
          <NovaVariante categoriaId={cat._id} token={token} onCriado={onMudou} />
        </div>
      ))}
    </>
  );
}

export default function AdminCatalogo() {
  const { token } = useAuth();
  const [catalogo, setCatalogo] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const c = await api.get('/admin/catalogo', token);
      setCatalogo(c);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const model = catalogo.filter((c) => c.tipo === 'model');
  const avulso = catalogo.filter((c) => c.tipo === 'item_avulso');

  return (
    <Layout>
      <div className="between">
        <h1>Gerenciar catálogo</h1>
        <Link to="/admin"><button className="secundario pequeno">← Voltar ao painel</button></Link>
      </div>
      <p className="muted">
        Edite preços, imagens e disponibilidade. Variantes desativadas somem do catálogo do
        cliente, mas continuam aqui para reativar.
      </p>

      <div style={{ margin: '12px 0' }}>
        <NovaCategoria token={token} onCriado={carregar} />
      </div>

      {carregando && <p className="muted">Carregando...</p>}
      {erro && <p className="erro">{erro}</p>}

      <Secao titulo="Categorias do Model" categorias={model} token={token} onMudou={carregar} />
      <Secao titulo="Itens avulsos" categorias={avulso} token={token} onMudou={carregar} />
    </Layout>
  );
}
