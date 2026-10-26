import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

// Estado público do site: aberto para os clientes ou pausado pelo artista.
// Se a API não responder, o site é tratado como aberto (nunca trava o cliente por falha de rede).
const SiteContext = createContext({ aberto: true, mensagem: '', carregado: false, recarregar: () => {} });

export function SiteProvider({ children }) {
  const [estado, setEstado] = useState({ aberto: true, mensagem: '', carregado: false });

  const recarregar = useCallback(
    () =>
      api
        .get('/config')
        .then((c) => setEstado({ aberto: c.siteAberto !== false, mensagem: c.mensagemPausa || '', carregado: true }))
        .catch(() => setEstado((e) => ({ ...e, carregado: true }))),
    []
  );

  useEffect(() => {
    recarregar();
    const id = setInterval(recarregar, 60000); // pega a mudança sem o cliente recarregar a página
    return () => clearInterval(id);
  }, [recarregar]);

  return <SiteContext.Provider value={{ ...estado, recarregar }}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}
