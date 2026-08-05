import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
