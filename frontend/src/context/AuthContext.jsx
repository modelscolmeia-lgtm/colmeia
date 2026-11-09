import { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

// Modo teste do artista: o site passa a mostrar o que um cliente comum vê, como a "Abelha Operária",
// com o boost simulado (ligado ou não). É só visual: nada é criado ou alterado no banco, e o envio de
// pedido é simulado. Só funciona para quem é artista de verdade.
const ABELHA = { id: 'modo-teste', nome: 'Abelha Operária', email: '', role: 'cliente', teste: true };

function lerModoTeste() {
  try {
    const t = JSON.parse(localStorage.getItem('colmeia_teste') || 'null');
    return t && typeof t === 'object' ? { booster: !!t.booster } : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('colmeia_usuario');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('colmeia_token'));
  const [teste, setTeste] = useState(lerModoTeste);

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

  function ligarModoTeste(booster = false) {
    localStorage.setItem('colmeia_teste', JSON.stringify({ booster: !!booster }));
    setTeste({ booster: !!booster });
  }

  function desligarModoTeste() {
    localStorage.removeItem('colmeia_teste');
    setTeste(null);
  }

  function logout() {
    desligarModoTeste();
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('colmeia_usuario');
    localStorage.removeItem('colmeia_token');
  }

  // só vale para artista de verdade; para qualquer outra conta o modo teste é ignorado
  const modoTeste = !!(teste && usuario?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        usuario: modoTeste ? ABELHA : usuario,
        usuarioReal: usuario,
        modoTeste,
        boosterTeste: !!teste?.booster,
        ligarModoTeste,
        desligarModoTeste,
        token,
        login,
        cadastrar,
        completarLoginDiscord,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de um AuthProvider');
  return ctx;
}
