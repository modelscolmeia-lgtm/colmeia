import { useEffect, useRef } from 'react';
import Icone from './Icone';

// Passo a passo por categoria: mostra uma categoria de cada vez, com barra de passos
// (hexágonos numerados), "Voltar" e "Próxima". Quem renderiza os cards da categoria atual
// é `renderCategoria`.
export default function PassosCategorias({ categorias, selecoes, passo, onPasso, renderCategoria }) {
  const topo = useRef(null);
  const espera = useRef(null);
  useEffect(() => () => clearTimeout(espera.current), []);
  if (!categorias.length) return null;

  const atual = Math.min(passo || 0, categorias.length - 1);
  const cat = categorias[atual];
  const escolhidos = (c) => c.variantes.filter((v) => selecoes[v._id]).length;

  function ir(p) {
    clearTimeout(espera.current); // um clique manual cancela o avanço automático
    onPasso(Math.max(0, Math.min(categorias.length - 1, p)));
    // volta ao começo do bloco para o cliente não ficar no meio da página
    requestAnimationFrame(() => topo.current?.scrollIntoView({ block: 'start' }));
  }

  // Categoria de escolha única: ao escolher um item, segue sozinho para a próxima (com uma
  // pausa curta para ver a escolha). Categoria que aceita várias opções não avança.
  function aoEscolher(categoria, ficouEscolhido) {
    if (!ficouEscolhido || categoria.permiteMultiplaSelecao || atual >= categorias.length - 1) return;
    clearTimeout(espera.current);
    espera.current = setTimeout(() => ir(atual + 1), 420);
  }

  return (
    <div className="passos-cat-bloco" ref={topo}>
      <p className="passos-cat-progresso">
        Passo {atual + 1} de {categorias.length}: <strong>{cat.nome}</strong>
      </p>
      <ol className="pbar" aria-label="Categorias">
        {categorias.map((c, i) => {
          const n = escolhidos(c);
          return (
            <li key={c._id}>
              <button
                type="button"
                className={'pbar-item' + (i === atual ? ' atual' : '') + (n > 0 ? ' feito' : '')}
                aria-current={i === atual ? 'step' : undefined}
                aria-label={`${c.nome}${n > 0 ? `, ${n} escolhido${n > 1 ? 's' : ''}` : ''}`}
                onClick={() => ir(i)}
              >
                <span className="pbar-hex">{n > 0 ? <Icone nome="check" tamanho={16} /> : i + 1}</span>
                <span className="pbar-nome">{c.nome}</span>
                {n > 1 && <span className="pbar-qtd" aria-hidden="true">{n}</span>}
              </button>
            </li>
          );
        })}
      </ol>

      {renderCategoria(cat, aoEscolher)}

      <div className="passos-cat-nav">
        <button type="button" className="secundario" onClick={() => ir(atual - 1)} disabled={atual === 0}>
          ← Voltar
        </button>
        {atual < categorias.length - 1 ? (
          <button type="button" onClick={() => ir(atual + 1)}>
            Próxima: {categorias[atual + 1].nome} →
          </button>
        ) : (
          <span className="muted">Terminou as categorias. Use “Revisar e enviar” logo abaixo.</span>
        )}
      </div>
    </div>
  );
}
