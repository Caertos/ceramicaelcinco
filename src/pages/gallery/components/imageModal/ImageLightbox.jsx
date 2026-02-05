import React from 'react';
import { useLightboxNavigation } from './hooks/useLightboxNavigation';
import { useFocusTrap } from './hooks/useFocusTrap';
import { useKeyboardEvents } from './hooks/useKeyboardEvents';
import LightboxControls from './components/LightboxControls';
import LightboxImage from './components/LightboxImage';
import '../../gallery.css';

/* =============================================================
   Componente: ImageLightbox (Refactorizado)
   Resumen: Lightbox de imágenes con arquitectura modular usando hooks especializados para navegación, focus trap y eventos.
   Diccionario:
     - navigationLogic: Hook que gestiona navegación circular con sincronización de paginación.
     - focusTrapLogic: Hook que maneja focus trap y enfoque inicial automático.
     - keyboardLogic: Hook que gestiona eventos de teclado globales.
     - modular components: Componentes especializados para controles e imagen.
   Funciones:
     - ImageLightbox(props): Coordina hooks especializados y renderiza layout con componentes modulares.
   ============================================================= */
// Nombre de la función: ImageLightbox
// Parámetros: { currentItem, lightboxIndex, items, sliceStart, PAGE_SIZE, page, setPage, setLightboxIndex, onClose }
// Proceso y salida: 
// 1. Utiliza hooks especializados para navegación, focus trap y eventos de teclado.
// 2. Renderiza modal con componentes modulares para controles e imagen.
// 3. Coordina comunicación entre hooks y manejo de accesibilidad.
// Refactorización: Separación total de lógica en hooks reutilizables y componentes especializados.

const ImageLightbox = ({ currentItem, lightboxIndex, items, sliceStart, PAGE_SIZE, page, setPage, setLightboxIndex, onClose }) => {
  const isOpen = lightboxIndex !== null && currentItem;

  // Hook para navegación circular con sincronización de paginación
  const navigationLogic = useLightboxNavigation({
    lightboxIndex,
    items,
    sliceStart,
    pageSize: PAGE_SIZE,
    page,
    setPage,
    setLightboxIndex
  });

  // Hook para focus trap y enfoque inicial
  const focusTrapLogic = useFocusTrap({ isOpen });

  // Hook para eventos de teclado globales
  useKeyboardEvents({
    isOpen,
    onClose,
    onPrev: navigationLogic.prev,
    onNext: navigationLogic.next
  });

  if (!isOpen) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Visor de imagen" onClick={onClose}>
      <div 
        ref={focusTrapLogic.containerRef} 
        className="lightbox-inner" 
        onClick={e => e.stopPropagation()}
      >
        <LightboxControls
          onClose={onClose}
          onPrev={navigationLogic.prev}
          onNext={navigationLogic.next}
          canNavigate={navigationLogic.canNavigate}
          initialFocusRef={focusTrapLogic.initialFocusRef}
        />
        
        <LightboxImage currentItem={currentItem} />
        
        <p className="lightbox-caption">{currentItem.nombre}</p>
      </div>
    </div>
  );
};

export default ImageLightbox;
