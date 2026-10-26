import { useState } from 'react';
import Lightbox from './Lightbox';
import { imagemUrl } from '../utils/pedido';

// Miniatura da imagem de um item, com "clique para ampliar" (lightbox).
// Usada em toda tela que mostra o nome de um item, para o artista/cliente entenderem.
export default function ItemImagem({ url, size = 44 }) {
  const [zoom, setZoom] = useState(false);
  const src = imagemUrl(url);

  if (!url) {
    return (
      <span className="item-img item-img-vazio" style={{ width: size, height: size }} title="Sem imagem">
        s/ img
      </span>
    );
  }

  return (
    <>
      <img
        className="item-img"
        src={src}
        alt=""
        title="Clique para ampliar"
        style={{ width: size, height: size, cursor: 'pointer' }}
        onClick={() => setZoom(true)}
        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
      />
      {zoom && <Lightbox src={src} onFechar={() => setZoom(false)} />}
    </>
  );
}
