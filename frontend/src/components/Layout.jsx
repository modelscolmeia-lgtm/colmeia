import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icone from './Icone';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { DISCORD_CONVITE } from '../utils/pedido';

const DISCORD_PATH =
  'M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z';
const TIKTOK_PATH =
  'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';

function Marca() {
  return (
    <Link to="/" className="lateral-marca" aria-label="Colmeia, início">
      <img src="/logo-menu.webp" alt="Colmeia" width="800" height="333" />
      <small>Custom models</small>
    </Link>
  );
}

export default function Layout({ children, largura = 'container' }) {
  const { usuario, logout } = useAuth();
  const { aberto: siteAberto, discordConvite } = useSite();
  const convite = discordConvite || DISCORD_CONVITE; // do backend; ou da variável do site, se houver
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  // fecha o menu ao trocar de página e com a tecla Esc
  useEffect(() => setMenuAberto(false), [pathname]);
  useEffect(() => {
    if (!menuAberto) return undefined;
    const aoTeclar = (e) => e.key === 'Escape' && setMenuAberto(false);
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [menuAberto]);

  function sair() {
    setMenuAberto(false);
    logout();
    navigate('/');
  }

  const admin = usuario?.role === 'admin';
  const pausado = !siteAberto && !admin; // site pausado: o cliente não tem para onde "fazer pedido"
  const iniciais = (usuario?.nome || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const link = (to, rotulo, icone, extra = {}) => (
    <NavLink key={to} to={to} end={to === '/' || to === '/admin'} className="lateral-link" {...extra}>
      <Icone nome={icone} />
      {rotulo}
    </NavLink>
  );

  return (
    <div className="app">
      <a href="#conteudo" className="pular">Pular para o conteúdo</a>
      <div className={'lateral-fundo' + (menuAberto ? ' aberto' : '')} onClick={() => setMenuAberto(false)} aria-hidden="true" />

      <aside className={'lateral' + (menuAberto ? ' aberta' : '')} id="menu-lateral" aria-label="Menu principal">
        <Marca />
        <nav className="lateral-nav">
          <div className="lateral-secao">Loja</div>
          {link('/', 'Início', 'casa')}
          {link('/portfolio', 'Portfólio', 'portfolio')}
          {link('/anuncios', 'Anúncios', 'anuncio')}
          {!pausado && link('/montar', 'Fazer pedido', 'pedido')}

          {usuario && <div className="lateral-secao">Pedidos</div>}
          {usuario && link('/meus-pedidos', 'Meus pedidos', 'lista')}
          {usuario && link('/fila', 'Fila de produção', 'fila')}

          {admin && <div className="lateral-secao">Artista</div>}
          {admin && link('/admin', 'Painel', 'painel')}
          {admin && link('/admin/catalogo', 'Catálogo', 'catalogo')}
          {admin && link('/admin/cupons', 'Cupons', 'cupom')}
        </nav>

        <div className="lateral-rodape">
          <div className="lateral-sociais">
            {convite && (
              <a href={convite} target="_blank" rel="noopener noreferrer" aria-label="Discord da Colmeia" title="Discord da Colmeia">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={DISCORD_PATH} /></svg>
              </a>
            )}
            <a href="https://www.tiktok.com/@colmeia.models" target="_blank" rel="noopener noreferrer" aria-label="TikTok da Colmeia" title="TikTok da Colmeia">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={TIKTOK_PATH} /></svg>
            </a>
          </div>
          {usuario ? (
            <div className="lateral-usuario">
              <span className="avatar" aria-hidden="true">{iniciais}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{usuario.nome?.split(' ')[0]}</strong>
                <small>{admin ? 'Artista' : 'Cliente'}</small>
              </div>
              <button type="button" className="icone-botao" onClick={sair} aria-label="Sair" title="Sair">
                <Icone nome="sair" />
              </button>
            </div>
          ) : (
            <div className="lateral-entrar">
              <Link to="/login"><button type="button">Entrar com Discord</button></Link>
            </div>
          )}
        </div>
      </aside>

      <div className="conteudo">
        <div className="topo-mobile">
          <button type="button" className="icone-botao" onClick={() => setMenuAberto((v) => !v)} aria-expanded={menuAberto} aria-controls="menu-lateral" aria-label="Abrir menu">
            <Icone nome="menu" tamanho={24} />
          </button>
          <Link to="/" aria-label="Colmeia, início"><img src="/logo-menu.webp" alt="Colmeia" width="800" height="333" /></Link>
          {usuario ? <span className="avatar" aria-hidden="true">{iniciais}</span> : <Link to="/login"><button type="button" className="pequeno">Entrar</button></Link>}
        </div>

        <main id="conteudo" className={largura}>{children}</main>

        <footer className="site-footer">
          <a href="https://otavio-ramalho.vercel.app/" target="_blank" rel="noopener noreferrer" className="credito">
            <img src="/penguin.png" alt="" className="credito-logo" />
            Desenvolvido por Pinguim
          </a>
        </footer>
      </div>
    </div>
  );
}
