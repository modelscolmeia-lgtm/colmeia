import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from '../components/Modal';

const DialogCtx = createContext(null);

/**
 * Substitui os window.confirm/alert nativos por modais no estilo do site
 * (centralizados, com o fundo embaçado). Uso:
 *   const { confirmar, avisar } = useDialog();
 *   if (await confirmar({ titulo, mensagem, perigo: true })) { ... }
 *   await avisar({ titulo, mensagem });
 */
export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const ref = useRef(null);
  ref.current = dialog;

  const fechar = useCallback((valor) => {
    ref.current?.resolver?.(valor);
    setDialog(null);
  }, []);

  const confirmar = useCallback(
    (opts = {}) =>
      new Promise((resolver) =>
        setDialog({ tipo: 'confirm', okLabel: 'Sim', cancelLabel: 'Cancelar', ...opts, resolver })
      ),
    []
  );

  const avisar = useCallback(
    (opts = {}) =>
      new Promise((resolver) => setDialog({ tipo: 'alert', okLabel: 'OK', ...opts, resolver })),
    []
  );

  const ehConfirm = dialog?.tipo === 'confirm';

  return (
    <DialogCtx.Provider value={{ confirmar, avisar }}>
      {children}
      <Modal
        aberto={!!dialog}
        titulo={dialog?.titulo || (ehConfirm ? 'Confirmar' : 'Aviso')}
        onFechar={() => fechar(false)}
        footer={
          ehConfirm ? (
            <>
              <button className="secundario" onClick={() => fechar(false)}>
                {dialog?.cancelLabel}
              </button>
              <button className={dialog?.perigo ? 'perigo' : ''} onClick={() => fechar(true)}>
                {dialog?.okLabel}
              </button>
            </>
          ) : (
            <button onClick={() => fechar(true)}>{dialog?.okLabel}</button>
          )
        }
      >
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.4 }}>{dialog?.mensagem}</p>
      </Modal>
    </DialogCtx.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error('useDialog precisa estar dentro de um DialogProvider');
  return ctx;
}
