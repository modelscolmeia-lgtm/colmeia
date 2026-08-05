import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RotaProtegida({ children, somenteAdmin = false }) {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;
  if (somenteAdmin && usuario.role !== 'admin') return <Navigate to="/" replace />;

  return children;
}
