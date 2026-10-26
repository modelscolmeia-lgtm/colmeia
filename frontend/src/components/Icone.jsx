// Ícones pixel desenhados em grade 8x8. Usam currentColor, então seguem o tema.
// Decorativos por padrão (aria-hidden); passe `titulo` para dar nome acessível.
const GRADES = {
  raio: [
    '....##..',
    '...##...',
    '..##....',
    '.######.',
    '...##...',
    '..##....',
    '.##.....',
    '.#......',
  ],
  check: [
    '........',
    '.......#',
    '......##',
    '#....##.',
    '##..##..',
    '.####...',
    '..##....',
    '........',
  ],
  fechar: [
    '#......#',
    '.##..##.',
    '..####..',
    '...##...',
    '..####..',
    '.##..##.',
    '#......#',
    '........',
  ],
  lupa: [
    '.####...',
    '#....#..',
    '#....#..',
    '#....#..',
    '.####...',
    '....##..',
    '.....##.',
    '......##',
  ],
  balao: [
    '########',
    '#......#',
    '#.#..#.#',
    '#......#',
    '########',
    '..##....',
    '.##.....',
    '##......',
  ],
  moeda: [
    '..####..',
    '.######.',
    '###..###',
    '##.##.##',
    '##.##.##',
    '###..###',
    '.######.',
    '..####..',
  ],
  aviso: [
    '...##...',
    '..#..#..',
    '..#..#..',
    '.#.##.#.',
    '.#.##.#.',
    '#......#',
    '#..##..#',
    '########',
  ],
  documento: [
    '######..',
    '#....##.',
    '#....###',
    '#.##...#',
    '#......#',
    '#.####.#',
    '#......#',
    '########',
  ],
  sol: [
    '....#....',
    '.#.....#.',
    '...###...',
    '..#####..',
    '#.#####.#',
    '..#####..',
    '...###...',
    '.#.....#.',
    '....#....',
  ],
  lua: [
    '..####..',
    '.###....',
    '###.....',
    '###.....',
    '###.....',
    '.###...#',
    '..######',
    '...####.',
  ],
  menu: [
    '........',
    '########',
    '........',
    '########',
    '........',
    '########',
    '........',
    '........',
  ],
  ampulheta: [
    '########',
    '.#....#.',
    '..#..#..',
    '...##...',
    '...##...',
    '..#..#..',
    '.#.##.#.',
    '########',
  ],
};

function Abelha({ tamanho, titulo, className }) {
  return (
    <svg
      className={'icone icone-abelha ' + (className || '')}
      viewBox="0 0 11 8"
      height={tamanho}
      width={(tamanho * 11) / 8}
      shapeRendering="crispEdges"
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <rect x="3" y="0" width="2" height="2" fill="#9adbff" />
      <rect x="6" y="0" width="2" height="2" fill="#9adbff" />
      <rect x="2" y="2" width="7" height="4" fill="#ffb800" />
      <rect x="4" y="2" width="1" height="4" fill="#1a1000" />
      <rect x="7" y="2" width="1" height="4" fill="#1a1000" />
      <rect x="0" y="3" width="2" height="2" fill="#ffb800" />
      <rect x="1" y="3" width="1" height="1" fill="#1a1000" />
      <rect x="9" y="6" width="1" height="1" fill="#1a1000" />
    </svg>
  );
}

export default function Icone({ nome, tamanho = 18, titulo, className }) {
  if (nome === 'abelha') return <Abelha tamanho={tamanho} titulo={titulo} className={className} />;
  const grade = GRADES[nome];
  if (!grade) return null;
  return (
    <svg
      className={'icone ' + (className || '')}
      viewBox={`0 0 ${grade[0].length} ${grade.length}`}
      width={tamanho}
      height={tamanho}
      fill="currentColor"
      shapeRendering="crispEdges"
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      {grade.flatMap((linha, y) =>
        [...linha].map((c, x) => (c === '#' ? <rect key={x + '-' + y} x={x} y={y} width="1" height="1" /> : null))
      )}
    </svg>
  );
}
