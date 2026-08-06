import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Layout({ children, largura = 'container' }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function sair() {
    logout();
    navigate('/');
  }

  return (
    <>
      <nav className="nav">
        <NavLink to="/" className="nav-logo">Colmeia</NavLink>

        {usuario ? (
          <>
            <NavLink to="/montar">Fazer pedido</NavLink>
            <NavLink to="/meus-pedidos">Meus pedidos</NavLink>
            <NavLink to="/fila">Fila</NavLink>
            {usuario.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
            {usuario.role === 'admin' && <NavLink to="/admin/catalogo">Catálogo</NavLink>}
            {usuario.role === 'admin' && <NavLink to="/admin/cupons">Cupons</NavLink>}
            <span className="nav-user">Olá, {usuario.nome?.split(' ')[0]}</span>
            <button className="link" onClick={sair}>Sair</button>
            <ThemeToggle />
          </>
        ) : (
          <>
            <NavLink to="/login">Entrar</NavLink>
            <NavLink to="/cadastro">Criar conta</NavLink>
            <ThemeToggle />
          </>
        )}
      </nav>
      <main className={largura}>{children}</main>
    </>
  );
}
