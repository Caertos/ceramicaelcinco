import React from 'react';

/*
Resumen:
Tarjeta de imagen clicable que dispara apertura de lightbox.

Diccionario:
- role="button": Permite interacción teclado sobre <img>.

Parámetros:
- item (obj): { url, nombre }
- index (number): Posición para callback.
- onClick (fn): Maneja apertura en padre.

Proceso y salida:
Renderiza <img> lazy con handlers click y Enter/Espacio que invocan onClick(index).

Notas:
- Podría sustituirse <img role=button> por <button> + <img alt="">.
*/
const ImageCard = ({ item, index, onClick }) => (
  <img
    src={`/endpoints/serve_media.php?p=${encodeURIComponent(item.url)}`}
    alt={item.nombre || ''}
    loading="lazy"
    decoding="async"
    role="button"
    tabIndex={0}
    aria-label={item.nombre ? `Ver imagen ${item.nombre}` : 'Ver imagen'}
    onClick={() => onClick(index)}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(index); } }}
  />
);

export default ImageCard;
