import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteProvider, useSite } from './context/SiteContext';
import Pausa from './pages/Pausa';
import Portfolio from './pages/Portfolio';
import Anuncios from './pages/Anuncios';
import RotaProtegida from './components/RotaProtegida';
import Home from './pages/Home';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import EntrarDiscord from './pages/EntrarDiscord';
import MontarPedido from './pages/MontarPedido';
import MeusPedidos from './pages/MeusPedidos';
import PedidoDetalhe from './pages/PedidoDetalhe';
import Fila from './pages/Fila';
import AdminDashboard from './pages/AdminDashboard';
import AdminCatalogo from './pages/AdminCatalogo';
import AdminCupons from './pages/AdminCupons';

// Site pausado: clientes veem a tela de pausa (o login continua livre para o artista entrar).
// O admin segue usando o site normalmente, com uma faixa lembrando que está pausado.
function PortaoSite({ children }) {
  const { aberto } = useSite();
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const admin = usuario?.role === 'admin';
  const livre = ['/login', '/cadastro', '/entrar-discord'].includes(pathname);

  if (!aberto && !admin && !livre) return <Pausa />;
  return (
    <>
      {!aberto && admin && (
        <div className="faixa-pausa" role="status">
          O site está <strong>pausado</strong> para os clientes. <Link to="/admin">Abrir o painel para ligar</Link>
        </div>
      )}
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
      <BrowserRouter>
        <PortaoSite>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/anuncios" element={<Anuncios />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha/:token" element={<RedefinirSenha />} />
          <Route path="/entrar-discord" element={<EntrarDiscord />} />

          <Route path="/montar" element={<RotaProtegida><MontarPedido /></RotaProtegida>} />
          <Route path="/meus-pedidos" element={<RotaProtegida><MeusPedidos /></RotaProtegida>} />
          <Route path="/pedido/:id" element={<RotaProtegida><PedidoDetalhe /></RotaProtegida>} />
          <Route path="/fila" element={<RotaProtegida><Fila /></RotaProtegida>} />

          <Route
            path="/admin"
            element={
              <RotaProtegida somenteAdmin>
                <AdminDashboard />
              </RotaProtegida>
            }
          />
          <Route
            path="/admin/catalogo"
            element={
              <RotaProtegida somenteAdmin>
                <AdminCatalogo />
              </RotaProtegida>
            }
          />
          <Route
            path="/admin/cupons"
            element={
              <RotaProtegida somenteAdmin>
                <AdminCupons />
              </RotaProtegida>
            }
          />
        </Routes>
        </PortaoSite>
      </BrowserRouter>
      </SiteProvider>
    </AuthProvider>
  );
}
