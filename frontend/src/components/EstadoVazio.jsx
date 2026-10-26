import { Link } from 'react-router-dom';
import Icone from './Icone';

// Estado vazio: diz o que está acontecendo e oferece o próximo passo.
export default function EstadoVazio({ titulo, texto, acao }) {
  return (
    <div className="vazio" role="status">
      <span className="vazio-abelha" aria-hidden="true">
        <Icone nome="estrela" />
      </span>
      <strong className="vazio-titulo">{titulo}</strong>
      {texto && <p className="muted vazio-texto">{texto}</p>}
      {acao && (
        <Link to={acao.para}>
          <button>{acao.rotulo}</button>
        </Link>
      )}
    </div>
  );
}
