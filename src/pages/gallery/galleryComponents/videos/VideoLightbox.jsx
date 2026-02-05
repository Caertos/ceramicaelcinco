import React, { useEffect, useRef } from 'react';
import '../../gallery.css';

/*
Resumen:
Lightbox para reproducción de video con autoFocus en botón cerrar y focus trap.

Diccionario:
- focus trap: Ciclo de foco dentro del modal.

Parámetros:
- currentItem (obj)
- isOpen (bool)
- onClose (fn)

Proceso y salida:
1. Monta abierto: listener Escape + foco en botón cerrar.
2. Implementa focus trap con Tab/Shift+Tab.
3. Renderiza overlay role=dialog con <video controls autoPlay>.

Notas:
- Podría agregar descripción detallada con aria-describedby.
*/

const VideoLightbox = ({ currentItem, isOpen, onClose }) => {
  const closeBtnRef = useRef(null);
  const containerRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    // Enfocar el botón de cerrar al abrir para accesibilidad
    setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Focus trap simple
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const node = containerRef.current;
    node?.addEventListener('keydown', onKeyDown);
    return () => node?.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen || !currentItem) return null;
  const src = `/endpoints/serve_media.php?p=${encodeURIComponent(currentItem.url)}`;
  return (
    <div className="lightbox lightbox--video" role="dialog" aria-modal="true" aria-label="Visor de video" onClick={onClose}>
      <div ref={containerRef} className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <button ref={closeBtnRef} className="lightbox-close" onClick={onClose} aria-label="Cerrar visor">×</button>
  <video src={src} controls autoPlay preload="metadata" crossOrigin="anonymous"/>
        <p className="lightbox-caption">{currentItem.nombre}</p>
      </div>
    </div>
  );
};

export default VideoLightbox;
