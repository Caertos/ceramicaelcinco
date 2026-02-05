import React from 'react';
import ImageLightbox from './imageModal/ImageLightbox';
import VideoLightbox from '../galleryComponents/videos/VideoLightbox';

/* =============================================================
   Componente: GalleryLightboxes
   Resumen: Componente que maneja la renderización condicional de lightboxes según el tipo de contenido.
   Diccionario:
     - currentItem: Elemento actualmente mostrado en lightbox.
     - tipo: Propiedad que determina si es 'foto' o 'video'.
     - lightbox condicional: Renderizado según tipo de contenido.
     - props passthrough: Todas las props necesarias se pasan a los componentes lightbox.
   Funciones:
     - GalleryLightboxes(props): Renderiza lightbox apropiado según tipo de contenido.
   ============================================================= */
// Nombre de la función: GalleryLightboxes
// Parámetros: { currentItem, lightboxIndex, items, sliceStart, pageSize, page, setPage, setLightboxIndex, onClose, isLightboxOpen }
// Proceso y salida: Renderiza condicionalmente ImageLightbox o VideoLightbox según el tipo del elemento actual.
const GalleryLightboxes = ({
  currentItem,
  lightboxIndex,
  items,
  sliceStart,
  pageSize,
  page,
  setPage,
  setLightboxIndex,
  onClose,
  isLightboxOpen
}) => {
  return (
    <>
      {currentItem?.tipo === 'foto' && (
        <ImageLightbox
          currentItem={currentItem}
          lightboxIndex={lightboxIndex}
          items={items}
          sliceStart={sliceStart}
          PAGE_SIZE={pageSize}
          page={page}
          setPage={setPage}
          setLightboxIndex={setLightboxIndex}
          onClose={onClose}
        />
      )}
      
      {currentItem?.tipo === 'video' && (
        <VideoLightbox
          currentItem={currentItem}
          isOpen={isLightboxOpen}
          onClose={onClose}
        />
      )}
    </>
  );
};

export default GalleryLightboxes;