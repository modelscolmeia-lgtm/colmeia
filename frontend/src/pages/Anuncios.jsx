import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Cabecalho from '../components/Cabecalho';
import EstadoVazio from '../components/EstadoVazio';
import Icone from '../components/Icone';
import Modal from '../components/Modal';
import Lightbox from '../components/Lightbox';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogProvider';
import { api } from '../services/api';
import { imagemUrl } from '../utils/pedido';

const LIMITE_MB = 3;
const IMPORTANCIA = {
  comum: { rotulo: 'Comum', classe: '' },
  importante: { rotulo: 'Importante', classe: 'warn' },
  urgente: { rotulo: 'Urgente', classe: 'danger' },
};
const VAZIO = { titulo: '', conteudo: '', importancia: 'comum', imagem: '', fixado: false, discordMarcar: 'nao' };

const data = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Mural de avisos do artista. O artista publica, edita, fixa e apaga; pode também mandar o aviso ao
// canal do Discord (com @everyone, se quiser) pelo webhook configurado no servidor.
export default function Anuncios() {
  const { usuario, token } = useAuth();
  const { confirmar } = useDialog();
  const admin = usuario?.role === 'admin';

  const [itens, setItens] = useState(null);
  const [erro, setErro] = useState('');
  const [discordAtivo, setDiscordAtivo] = useState(false);
  const [ampliar, setAmpliar] = useState('');

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null); // anúncio em edição
  const [f, setF] = useState(VAZIO);
  const [arquivo, setArquivo] = useState(null);
  const [previa, setPrevia] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [aviso, setAviso] = useState('');

  const carregar = useCallback(() => {
    api.get('/anuncios').then(setItens).catch((e) => { setErro(e.message); setItens([]); });
  }, []);
  useEffect(() => carregar(), [carregar]);
  useEffect(() => {
    if (admin) api.get('/admin/anuncios/config', token).then((c) => setDiscordAtivo(!!c.discord)).catch(() => {});
  }, [admin, token]);

  const set = (campo, valor) => setF((x) => ({ ...x, [campo]: valor }));

  function abrirNovo() {
    setEditando(null);
    setF(VAZIO);
    setArquivo(null);
    setPrevia('');
    setErroForm('');
    setModal(true);
  }

  function abrirEdicao(a) {
    setEditando(a);
    setF({ titulo: a.titulo, conteudo: a.conteudo || '', importancia: a.importancia, imagem: a.imagem || '', fixado: !!a.fixado, discordMarcar: 'nao' });
    setArquivo(null);
    setPrevia(a.imagem ? imagemUrl(a.imagem) : '');
    setErroForm('');
    setModal(true);
  }

  function fecharModal() {
    if (enviando) return;
    if (arquivo && previa) URL.revokeObjectURL(previa);
    setModal(false);
  }

  function escolherArquivo(e) {
    const file = e.target.files?.[0];
    setErroForm('');
    if (!file) return;
    if (!file.type.startsWith('image/')) return setErroForm('Escolha um arquivo de imagem.');
    if (file.size > LIMITE_MB * 1024 * 1024) return setErroForm(`A imagem passa de ${LIMITE_MB} MB. Use uma menor.`);
    setArquivo(file);
    setPrevia(URL.createObjectURL(file));
  }

  function tirarImagem() {
    setArquivo(null);
    setPrevia('');
    set('imagem', '');
  }

  async function salvar() {
    if (!f.titulo.trim()) return setErroForm('Dê um título ao anúncio.');
    setEnviando(true);
    setErroForm('');
    try {
      let imagem = f.imagem;
      if (arquivo) imagem = (await api.upload('/admin/upload', arquivo, token)).url;
      const corpo = { ...f, imagem };
      const r = editando
        ? await api.put(`/admin/anuncios/${editando._id}`, corpo, token)
        : await api.post('/admin/anuncios', corpo, token);
      if (r.discord?.erro) setAviso('Publicado no site, mas o envio ao Discord falhou. Veja se o webhook ainda existe.');
      else if (r.discord?.estado === 'enviado') setAviso('Publicado no site e enviado ao Discord.');
      else if (r.discord?.estado === 'atualizado') setAviso('Anúncio atualizado no site e no Discord.');
      else setAviso(editando ? 'Anúncio atualizado.' : 'Anúncio publicado.');
      setEnviando(false);
      setModal(false);
      carregar();
    } catch (e) {
      setErroForm(e.message);
      setEnviando(false);
    }
  }

  async function apagar(a) {
    const ok = await confirmar({
      titulo: 'Apagar anúncio',
      mensagem: `Apagar "${a.titulo}"? Se ele foi enviado ao Discord, a mensagem de lá também é apagada.`,
      okLabel: 'Apagar',
      cancelLabel: 'Voltar',
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/anuncios/${a._id}`, token);
      setAviso('Anúncio apagado.');
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function alternarFixo(a) {
    try {
      await api.put(`/admin/anuncios/${a._id}/fixar`, { fixado: !a.fixado }, token);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <Layout largura="container-narrow">
      <Cabecalho titulo="Anúncios" subtitulo="Novidades, avisos e promoções do artista.">
        {admin && (
          <button onClick={abrirNovo}>
            <Icone nome="anuncio" /> Novo anúncio
          </button>
        )}
      </Cabecalho>
      {erro && <p className="erro">{erro}</p>}
      {aviso && <p className="sucesso-msg" role="status">{aviso}</p>}

      {itens && itens.length === 0 && (
        <EstadoVazio titulo="Nenhum anúncio por enquanto" texto="Quando o artista publicar novidades, elas aparecem aqui." />
      )}

      <div className="stack" style={{ gap: 14 }}>
        {(itens || []).map((a) => {
          const imp = IMPORTANCIA[a.importancia] || IMPORTANCIA.comum;
          return (
            <article className={'card anuncio ' + a.importancia + (a.fixado ? ' fixado' : '')} key={a._id}>
              <div className="anuncio-topo">
                {a.fixado && <span className="badge gold"><Icone nome="fixar" /> Fixado</span>}
                {a.importancia !== 'comum' && <span className={'badge ' + imp.classe}>{imp.rotulo}</span>}
                <span className="muted anuncio-data">
                  {a.autorNome ? `${a.autorNome} · ` : ''}{data(a.createdAt)}
                  {new Date(a.updatedAt) - new Date(a.createdAt) > 60000 ? ' · editado' : ''}
                </span>
              </div>
              <h2 className="anuncio-titulo">{a.titulo}</h2>
              {a.conteudo && <p className="anuncio-texto">{a.conteudo}</p>}
              {a.imagem && (
                <button type="button" className="anuncio-img" onClick={() => setAmpliar(imagemUrl(a.imagem))} aria-label="Ampliar a imagem do anúncio">
                  <img src={imagemUrl(a.imagem)} alt="" loading="lazy" decoding="async" />
                </button>
              )}
              {admin && (
                <div className="anuncio-acoes">
                  <button className="secundario pequeno" onClick={() => alternarFixo(a)}>{a.fixado ? 'Desafixar' : 'Fixar no topo'}</button>
                  <button className="secundario pequeno" onClick={() => abrirEdicao(a)}>Editar</button>
                  <button className="perigo pequeno" onClick={() => apagar(a)}>Apagar</button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {ampliar && <Lightbox src={ampliar} onFechar={() => setAmpliar('')} />}

      <Modal
        aberto={modal}
        titulo={editando ? 'Editar anúncio' : 'Novo anúncio'}
        onFechar={fecharModal}
        footer={
          <>
            <button className="secundario" onClick={fecharModal} disabled={enviando}>Cancelar</button>
            <button onClick={salvar} disabled={enviando || !f.titulo.trim()}>
              {enviando ? 'Salvando...' : editando ? 'Salvar' : 'Publicar'}
            </button>
          </>
        }
      >
        <div className="stack" style={{ gap: 14 }}>
          <label htmlFor="an-titulo">
            Título
            <input id="an-titulo" value={f.titulo} maxLength={120} placeholder="Ex: Vagas abertas para encomendas" onChange={(e) => set('titulo', e.target.value)} />
          </label>
          <label htmlFor="an-texto">
            Mensagem
            <textarea id="an-texto" rows={5} value={f.conteudo} maxLength={4000} onChange={(e) => set('conteudo', e.target.value)} />
          </label>
          <label htmlFor="an-imp">
            Importância
            <select id="an-imp" value={f.importancia} onChange={(e) => set('importancia', e.target.value)}>
              <option value="comum">Comum</option>
              <option value="importante">Importante</option>
              <option value="urgente">Urgente</option>
            </select>
          </label>
          <label htmlFor="an-arquivo">
            Imagem <span className="muted" style={{ fontWeight: 400 }}>(opcional, até {LIMITE_MB} MB)</span>
            <input id="an-arquivo" type="file" accept="image/*" onChange={escolherArquivo} />
          </label>
          {previa && (
            <>
              <img src={previa} alt="Prévia da imagem escolhida" className="portfolio-previa" />
              <button type="button" className="secundario pequeno" onClick={tirarImagem}>Tirar imagem</button>
            </>
          )}
          <label className="check-linha" htmlFor="an-fixo">
            <input id="an-fixo" type="checkbox" checked={f.fixado} onChange={(e) => set('fixado', e.target.checked)} />
            Fixar no topo da lista
          </label>
          {discordAtivo && (
            <label htmlFor="an-discord">
              Avisar no Discord
              <select id="an-discord" value={f.discordMarcar} onChange={(e) => set('discordMarcar', e.target.value)}>
                <option value="nao">Não, só no site</option>
                <option value="ninguem">Sim, sem marcar ninguém</option>
                <option value="todos">Sim, marcando @everyone</option>
              </select>
              {editando && <span className="muted" style={{ fontWeight: 400 }}>Editar atualiza a mensagem que já está no Discord, sem avisar de novo.</span>}
            </label>
          )}
          {erroForm && <p className="erro" style={{ margin: 0 }}>{erroForm}</p>}
        </div>
      </Modal>
    </Layout>
  );
}
