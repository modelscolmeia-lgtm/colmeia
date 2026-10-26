import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Cabecalho from '../components/Cabecalho';
import Icone from '../components/Icone';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogProvider';
import { api } from '../services/api';
import { imagemUrl } from '../utils/pedido';
import fixos from '../data/portfolio.json';

const POR_PAGINA = 12;
const LIMITE_MB = 3;

// Galeria dos models já feitos pelo artista. O artista adiciona e remove trabalhos pelo próprio site;
// os 49 trabalhos do começo ficam fixos no projeto.
export default function Portfolio() {
  const { usuario, token } = useAuth();
  const { confirmar } = useDialog();
  const admin = usuario?.role === 'admin';

  const [novos, setNovos] = useState([]); // adicionados pelo artista (banco)
  const [paginas, setPaginas] = useState(1);
  const [aberto, setAberto] = useState(null); // índice do trabalho ampliado

  // formulário de novo trabalho
  const [modal, setModal] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [previa, setPrevia] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(() => {
    api.get('/portfolio').then(setNovos).catch(() => setNovos([]));
  }, []);
  useEffect(() => carregar(), [carregar]);

  // lista final: os novos primeiro, depois os fixos
  const todos = useMemo(
    () => [
      ...novos.map((n) => ({ id: n._id, titulo: n.titulo, src: imagemUrl(n.imagem), removivel: true })),
      ...fixos.map((f) => ({ titulo: f.titulo, src: f.imagem, removivel: false })),
    ],
    [novos]
  );
  const visiveis = Math.min(todos.length, paginas * POR_PAGINA);

  // Esc fecha a imagem ampliada; setas trocam de trabalho.
  useEffect(() => {
    if (aberto == null) return undefined;
    const aoTeclar = (e) => {
      if (e.key === 'Escape') setAberto(null);
      if (e.key === 'ArrowRight') setAberto((i) => Math.min(todos.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setAberto((i) => Math.max(0, i - 1));
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, todos.length]);

  function escolherArquivo(e) {
    const f = e.target.files?.[0];
    setErro('');
    if (!f) return;
    if (!f.type.startsWith('image/')) return setErro('Escolha um arquivo de imagem.');
    if (f.size > LIMITE_MB * 1024 * 1024) return setErro(`A imagem passa de ${LIMITE_MB} MB. Use uma menor.`);
    setArquivo(f);
    setPrevia(URL.createObjectURL(f));
  }

  function fecharModal() {
    if (enviando) return;
    if (previa) URL.revokeObjectURL(previa);
    setModal(false);
    setTitulo('');
    setArquivo(null);
    setPrevia('');
    setErro('');
  }

  async function salvar() {
    if (!arquivo) return setErro('Escolha uma imagem.');
    if (!titulo.trim()) return setErro('Dê um título ao trabalho.');
    setEnviando(true);
    setErro('');
    try {
      const { url } = await api.upload('/admin/upload', arquivo, token);
      await api.post('/admin/portfolio', { titulo: titulo.trim(), imagem: url }, token);
      setEnviando(false);
      fecharModal();
      carregar();
      setPaginas(1);
    } catch (e) {
      setErro(e.message);
      setEnviando(false);
    }
  }

  async function remover(item) {
    const ok = await confirmar({
      titulo: 'Remover do portfólio',
      mensagem: `Remover "${item.titulo}" do portfólio? A imagem deixa de aparecer no site.`,
      okLabel: 'Remover',
      cancelLabel: 'Voltar',
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/portfolio/${item.id}`, token);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <Layout>
      <Cabecalho titulo="Portfólio" subtitulo="Alguns dos models que o artista já fez. Clique numa imagem para ver em tamanho grande.">
        {admin && (
          <button onClick={() => setModal(true)}>
            <Icone nome="portfolio" /> Adicionar imagem
          </button>
        )}
      </Cabecalho>
      {erro && !modal && <p className="erro">{erro}</p>}

      <div className="portfolio-grade">
        {todos.slice(0, visiveis).map((t, i) => (
          <figure className="portfolio-card" key={t.id || t.src}>
            <button type="button" className="portfolio-img" onClick={() => setAberto(i)} aria-label={`Ampliar: ${t.titulo}`}>
              <img src={t.src} alt="" width="1080" height="1080" loading="lazy" decoding="async" />
            </button>
            {admin && t.removivel && (
              <button type="button" className="portfolio-remover" onClick={() => remover(t)} aria-label={`Remover ${t.titulo}`} title="Remover do portfólio">
                <Icone nome="fechar" />
              </button>
            )}
            <figcaption>{t.titulo}</figcaption>
          </figure>
        ))}
      </div>

      <div className="center" style={{ marginTop: 22 }}>
        {visiveis < todos.length && (
          <button className="secundario" onClick={() => setPaginas((p) => p + 1)}>
            Mostrar mais ({todos.length - visiveis} restantes)
          </button>
        )}
      </div>

      <div className="portfolio-cta">
        <strong>Gostou? Peça o seu.</strong>
        <Link to={usuario ? '/montar' : '/login'}>
          <button className="cta">{usuario ? 'Fazer um pedido' : 'Entrar com Discord e pedir'}</button>
        </Link>
      </div>

      {aberto != null && todos[aberto] && (
        <div className="lightbox portfolio-lightbox" role="dialog" aria-label={todos[aberto].titulo} onClick={() => setAberto(null)}>
          <img src={todos[aberto].src} alt={todos[aberto].titulo} />
          <p className="lightbox-legenda">{todos[aberto].titulo} · {aberto + 1} de {todos.length}</p>
          <button className="lightbox-fechar" onClick={() => setAberto(null)} aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </div>
      )}

      <Modal
        aberto={modal}
        titulo="Adicionar ao portfólio"
        onFechar={fecharModal}
        footer={
          <>
            <button className="secundario" onClick={fecharModal} disabled={enviando}>Cancelar</button>
            <button onClick={salvar} disabled={enviando || !arquivo || !titulo.trim()}>
              {enviando ? 'Enviando...' : 'Adicionar'}
            </button>
          </>
        }
      >
        <div className="stack" style={{ gap: 14 }}>
          <label htmlFor="port-titulo">
            Título do trabalho
            <input id="port-titulo" value={titulo} maxLength={120} placeholder="Ex: Modelo da Operária Luna" onChange={(e) => setTitulo(e.target.value)} />
          </label>
          <label htmlFor="port-arquivo">
            Imagem <span className="muted" style={{ fontWeight: 400 }}>(até {LIMITE_MB} MB)</span>
            <input id="port-arquivo" type="file" accept="image/*" onChange={escolherArquivo} />
          </label>
          {previa && <img src={previa} alt="Prévia da imagem escolhida" className="portfolio-previa" />}
          {erro && <p className="erro" style={{ margin: 0 }}>{erro}</p>}
        </div>
      </Modal>
    </Layout>
  );
}
