// Lista todas as categorias de uma vez, uma abaixo da outra (Skin, Cabelo, Chifres...), cada uma com
// os cards das opções. Quem renderiza os cards de cada categoria é `renderCategoria`.
// (O nome do arquivo vem da versão anterior, que mostrava uma categoria por vez.)
const semAvanco = () => {};

export default function PassosCategorias({ categorias, renderCategoria }) {
  if (!categorias.length) return null;
  return (
    <div className="categorias-lista">
      {categorias.map((c) => (
        <div key={c._id}>{renderCategoria(c, semAvanco)}</div>
      ))}
    </div>
  );
}
