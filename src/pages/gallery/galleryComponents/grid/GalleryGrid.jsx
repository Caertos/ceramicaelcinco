import React from 'react';
import '../../gallery.css';
import ImageCard from '../images/ImageCard';
import VideoCard from '../videos/VideoCard';

/*
Resumen:
Grid responsivo de ítems de galería (imagen o video) con delegación a tarjetas específicas.

Diccionario:
- aria-roledescription: Texto descriptivo del tipo de item.

Parámetros:
- items (Array)
- onImageClick (fn): Callback con índice dentro de items de página.

Proceso y salida:
Mapea items generando tarjetas ar-4-3; decide componente según item.tipo.

Notas:
- Puede soportar virtualización si lista crece.
*/

const GalleryGrid = ({ items, onImageClick }) => {
  return (
    <div className="gallery-grid" role="list" aria-label="Resultados de la galería">
      {items.map((item, idx) => (
  <div key={item.id} className="gallery-card ar-4-3" role="listitem" aria-roledescription={item.tipo === 'foto' ? 'imagen' : 'video'}>
          {item.tipo === 'foto' ? (
            <ImageCard item={item} index={idx} onClick={onImageClick} />)
            : (<VideoCard item={item} onClick={() => onImageClick(idx)} />)
          }
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;
