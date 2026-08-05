import { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('colmeia_usuario');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('colmeia_token'));

  function salvarSessao(data) {
    setUsuario(data.usuario);
    setToken(data.token);
    localStorage.setItem('colmeia_usuario', JSON.stringify(data.usuario));
    localStorage.setItem('colmeia_token', data.token);
  }

  async function login(email, senha) {
    const data = await api.post('/auth/login', { email, senha });
    salvarSessao(data);
    return data.usuario;
  }

  async function cadastrar(nome, email, senha) {
    const data = await api.post('/auth/cadastro', { nome, email, senha });
    salvarSessao(data);
    return data.usuario;
  }

  // Completa o login via Discord: recebe o token (vindo do callback) e busca o usuário.
  async function completarLoginDiscord(tokenDiscord) {
    const usuario = await api.get('/auth/me', tokenDiscord);
    salvarSessao({ token: tokenDiscord, usuario });
    return usuario;
  }

  function logout() {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('colmeia_usuario');
    localStorage.removeItem('colmeia_token');
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, cadastrar, completarLoginDiscord, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de um AuthProvider');
  return ctx;
}
