import React from 'react';

/*
Resumen:
Tarjeta de video (miniatura reproducible en silencio) que abre lightbox al clic.

Diccionario:
- preload="metadata": Carga solo metadatos para rapidez.

Parámetros:
- item (obj): { url, nombre }
- onClick (fn)

Proceso y salida:
Renderiza <button> conteniendo <video> (sin controles) y título superpuesto.

Notas:
- Se podría generar thumbnail estático para menor costo.
*/
const VideoCard = ({ item, onClick }) => {
  const src = `/endpoints/serve_media.php?p=${encodeURIComponent(item.url)}`;
  return (
    <button
      type="button"
      className="video-thumb ar-4-3"
      onClick={onClick}
      aria-label={`Ver video ${item.nombre}`}
    >
  <video src={src} preload="metadata" playsInline crossOrigin="anonymous" />
      <span className="video-thumb-title">{item.nombre}</span>
    </button>
  );
};

export default VideoCard;
