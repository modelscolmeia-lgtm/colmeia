import Icone from './Icone';

// As 6 etapas do caminho do pedido e o status que corresponde a cada uma.
const ETAPAS = [
  { rotulo: 'Enviado', status: 'pendente_aprovacao' },
  { rotulo: 'Orçado', status: 'orcado' },
  { rotulo: 'Pix', status: 'aguardando_pagamento' },
  { rotulo: 'Na fila', status: 'fila_producao' },
  { rotulo: 'Produção', status: 'em_producao' },
  { rotulo: 'Pronto', status: 'concluido' },
];

// O que o cliente precisa saber em cada etapa (responde "e agora?").
export const PROXIMO_PASSO = {
  pendente_aprovacao: 'O artista está montando o seu orçamento. Você recebe um aviso no Discord quando ficar pronto.',
  orcado: 'O orçamento está pronto. Confira os valores e aceite ou recuse abaixo.',
  aguardando_pagamento: 'Pague a entrada (50%) por Pix e envie o comprovante no ticket do Discord.',
  fila_producao: 'Pagamento confirmado. Seu pedido está na fila de produção.',
  em_producao: 'O artista está produzindo o seu model agora.',
  concluido: 'Pronto! O artista combina a entrega com você no Discord.',
};

// Status que encerram o pedido sem chegar ao fim: não têm linha de etapas.
const ENCERRADOS = ['recusado_cliente', 'cancelado', 'expirado'];

export function temEtapas(status) {
  return !ENCERRADOS.includes(status) && ETAPAS.some((e) => e.status === status);
}

// Linha de hexágonos: feitos em mel, o atual com anel, os próximos vazios.
// `compacto` mostra só o nome da etapa atual (para listas).
export default function EtapasPedido({ status, compacto = false }) {
  const atual = ETAPAS.findIndex((e) => e.status === status);
  if (atual < 0 || ENCERRADOS.includes(status)) return null;
  const finalizado = status === 'concluido';

  return (
    <ol className={'etapas' + (compacto ? ' compacto' : '')} aria-label="Etapas do pedido">
      {ETAPAS.map((e, i) => {
        const feito = i < atual || finalizado;
        const ehAtual = i === atual && !finalizado;
        const estado = feito ? 'feito' : ehAtual ? 'atual' : 'futuro';
        return (
          <li key={e.status} className={'etapa ' + estado} aria-current={ehAtual ? 'step' : undefined}>
            <span className="etapa-hex">{feito ? <Icone nome="check" tamanho={14} /> : i + 1}</span>
            <span className="etapa-nome">{e.rotulo}</span>
            <span className="sr-only">{feito ? ' (concluída)' : ehAtual ? ' (etapa atual)' : ' (próxima)'}</span>
          </li>
        );
      })}
    </ol>
  );
}
