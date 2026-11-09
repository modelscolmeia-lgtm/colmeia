import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Aviso sempre visível enquanto o artista está vendo o site como a "Abelha Operária".
export default function FaixaModoTeste() {
  const { modoTeste, boosterTeste, ligarModoTeste, desligarModoTeste } = useAuth();
  const navigate = useNavigate();
  if (!modoTeste) return null;

  return (
    <div className="faixa-teste" role="status">
      <span>
        <strong>Modo teste:</strong> você está vendo o site como a <strong>Abelha Operária</strong>. Nada é salvo de verdade.
      </span>
      <span className="faixa-teste-acoes">
        <button className={'pequeno ' + (boosterTeste ? 'secundario' : '')} onClick={() => ligarModoTeste(false)} aria-pressed={!boosterTeste}>
          Não booster
        </button>
        <button className={'pequeno ' + (boosterTeste ? '' : 'secundario')} onClick={() => ligarModoTeste(true)} aria-pressed={boosterTeste}>
          Booster
        </button>
        <button
          className="pequeno perigo"
          onClick={() => {
            desligarModoTeste();
            navigate('/admin');
          }}
        >
          Sair do modo teste
        </button>
      </span>
    </div>
  );
}
