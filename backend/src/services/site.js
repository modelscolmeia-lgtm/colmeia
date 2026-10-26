import Config from '../models/Config.js';

export const MENSAGEM_PAUSA_PADRAO = 'O site está fechado por enquanto. Voltamos em breve!';

// Estado do "liga/desliga" do site para os clientes. Sem config salva = aberto.
export async function getSite() {
  const c = await Config.findById('geral').select('siteAberto mensagemPausa').lean();
  const personalizada = c?.mensagemPausa?.trim() || '';
  return {
    aberto: c?.siteAberto !== false,
    mensagem: personalizada || MENSAGEM_PAUSA_PADRAO,
    mensagemPersonalizada: personalizada,
  };
}

// Liga ou desliga o site e/ou muda o aviso mostrado aos clientes.
export async function setSite({ aberto, mensagem }) {
  const campos = {};
  if (typeof aberto === 'boolean') campos.siteAberto = aberto;
  if (typeof mensagem === 'string') campos.mensagemPausa = mensagem.trim().slice(0, 300);
  await Config.findByIdAndUpdate('geral', campos, { upsert: true, new: true, setDefaultsOnInsert: true });
  return getSite();
}
