import React from 'react';

/* =============================================================
   Componente: LightboxControls
   Resumen: Controles de navegación y cierre para el lightbox con accesibilidad completa.
   Diccionario:
     - lightbox-close: Clase CSS para botón de cerrar en esquina superior.
     - lightbox-nav: Clase CSS para botones de navegación lateral.
     - aria-label: Etiquetas de accesibilidad para lectores de pantalla.
     - initialFocusRef: Referencia al elemento que recibe foco inicial.
   Funciones:
     - LightboxControls(props): Renderiza botones de control con refs y handlers apropiados.
   ============================================================= */
// Nombre de la función: LightboxControls
// Parámetros: { onClose, onPrev, onNext, canNavigate, initialFocusRef }
// Proceso y salida: Renderiza botones de cerrar y navegación con accesibilidad y estados habilitados/deshabilitados.
const LightboxControls = ({ onClose, onPrev, onNext, canNavigate, initialFocusRef }) => {
  return (
    <>
      <button 
        ref={initialFocusRef}
        className="lightbox-close" 
        onClick={onClose} 
        aria-label="Cerrar visor"
      >
        ×
      </button>
      
      <button 
        className="lightbox-nav nav-prev" 
        onClick={onPrev} 
        disabled={!canNavigate} 
        aria-label="Anterior"
      >
        ‹
      </button>
      
      <button 
        className="lightbox-nav nav-next" 
        onClick={onNext} 
        disabled={!canNavigate} 
        aria-label="Siguiente"
      >
        ›
      </button>
    </>
  );
};

export default LightboxControls;