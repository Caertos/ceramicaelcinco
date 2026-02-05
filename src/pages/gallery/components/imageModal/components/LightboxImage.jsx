import React from 'react';

/* =============================================================
   Componente: LightboxImage
   Resumen: Componente para renderizar la imagen principal del lightbox con configuración optimizada.
   Diccionario:
     - decoding="async": Optimización para carga asíncrona de imagen.
     - encodeURIComponent: Codificación segura de URL para parámetros.
     - serve_media.php: Endpoint del servidor para servir archivos multimedia.
   Funciones:
     - LightboxImage({ currentItem }): Renderiza imagen con URL segura y metadatos de accesibilidad.
   ============================================================= */
// Nombre de la función: LightboxImage
// Parámetros: { currentItem: { url, nombre } }
// Proceso y salida: Renderiza imagen principal con URL construida de forma segura y atributos de accesibilidad.
const LightboxImage = ({ currentItem }) => {
  return (
    <img 
      src={`/endpoints/serve_media.php?p=${encodeURIComponent(currentItem.url)}`} 
      alt={currentItem.nombre} 
      decoding="async" 
    />
  );
};

export default LightboxImage;