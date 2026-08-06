// Helpers compartilhados de formatação e rótulos de status.

export function formatBRL(valor) {
  if (valor == null || isNaN(valor)) return '—';
  return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
}

// Normaliza texto para busca: minúsculo e sem acento.
export const normaliza = (s) =>
  (s ?? '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Faixa de preço de uma variante: fixo ("R$ 10") ou intervalo ("R$ 25 a 35").
export function faixaPreco(variante) {
  if (variante.precoMax && variante.precoMax !== variante.precoMin) {
    return `R$ ${variante.precoMin} a ${variante.precoMax}`;
  }
  return `R$ ${variante.precoMin}`;
}

export const STATUS_INFO = {
  pendente_aprovacao: { label: 'Aguardando aprovação', cor: 'warn' },
  orcado: { label: 'Orçamento enviado', cor: 'info' },
  recusado_cliente: { label: 'Recusado', cor: 'danger' },
  cancelado: { label: 'Cancelado', cor: 'danger' },
  aguardando_pagamento: { label: 'Aguardando pagamento', cor: 'warn' },
  fila_producao: { label: 'Na fila de produção', cor: 'info' },
  em_producao: { label: 'Em produção', cor: 'gold' },
  concluido: { label: 'Concluído', cor: 'success' },
};

// Link de convite do servidor do Discord (para o cliente entrar no atendimento).
export const DISCORD_CONVITE = import.meta.env.VITE_DISCORD_CONVITE || '';

// Resolve a URL de exibição de uma imagem: URLs absolutas (http/data) passam direto;
// caminhos relativos do backend (/uploads/...) ganham a origem da API.
export function imagemUrl(src) {
  if (!src) return '';
  if (/^(https?:|data:)/i.test(src)) return src;
  const api = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const origem = api.replace(/\/api\/?$/, '');
  return origem + src;
}

export function statusLabel(status) {
  return STATUS_INFO[status]?.label || status;
}

// Itens personalizados (texto livre) que o cliente pode preencher.
export const ITENS_PERSONALIZADOS = [
  {
    tipo: 'Item Específico',
    placeholder: 'Descreva um item específico que você quer no model',
    dica: 'Valor definido pelo artista',
  },
  {
    tipo: 'Animação Específica',
    placeholder: 'Descreva a animação que você imagina',
    dica: 'R$ 15 a 35 (o artista confirma)',
  },
  {
    tipo: 'Pet Específico',
    placeholder: 'Descreva um pet que você queira, fora do catálogo',
    dica: 'Valor definido pelo artista',
  },
];

// Link para o documento completo de termos e condições.
// Troque pela URL do seu documento (ou defina VITE_TERMOS_URL no .env do frontend).
export const TERMOS_URL =
  import.meta.env.VITE_TERMOS_URL || 'https://exemplo.com/termos-e-condicoes';

// Resumo dos principais pontos (o documento completo está em TERMOS_URL).
export const TERMOS = [
  {
    titulo: 'Direito de Imagem',
    texto:
      'O artista pode exibir o model criado em portfólio, redes sociais e divulgação, sem identificar o cliente sem autorização.',
  },
  {
    titulo: 'Reutilização de Partes Não Principais',
    texto:
      'Partes como orelhas, chifres, caudas, asas e outros elementos secundários podem ser reutilizados pelo artista como base para futuros trabalhos.',
  },
];

// Prazo estimado formatado a partir da data que o pedido entrou em produção.
export function janelaPrazo(dataEntrouProducao, prazo = { min: 20, max: 45 }) {
  if (!dataEntrouProducao) return null;
  const base = new Date(dataEntrouProducao);
  const ini = new Date(base);
  ini.setDate(ini.getDate() + prazo.min);
  const fim = new Date(base);
  fim.setDate(fim.getDate() + prazo.max);
  const fmt = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${fmt(ini)} a ${fmt(fim)}`;
}
