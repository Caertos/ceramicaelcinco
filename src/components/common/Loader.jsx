import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './loader.css';

/*
Resumen:
Overlay de carga global con animación (video loop) y bloqueo opcional de scroll.

Diccionario:
- scroll lock: Técnica para impedir desplazamiento del body usando overflow hidden.
- portal: Renderizado fuera del árbol padre mediante createPortal.

Parámetros:
- message (string, default 'Cargando…'): Texto accesible.
- lockScroll (boolean, default true): Controla bloqueo de scroll mientras visible.

Proceso y salida:
1. Monta: si lockScroll incrementa contador global y aplica overflow hidden.
2. Desmonta: decrementa y restaura overflow cuando contador llega a 0.
3. Retorna overlay con role="status" y video animado.

Notas:
- Maneja múltiples instancias con contador compartido.
- Puede ampliarse para prefer-reduced-motion.
*/
let __loaderScrollLockCount = 0;
const lockBodyScroll = () => {
  if (__loaderScrollLockCount++ === 0) {
    // Guarda overflow previo y bloquea scroll del body
    document.body.dataset.prevOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
  }
};
const unlockBodyScroll = () => {
  if (--__loaderScrollLockCount <= 0) {
    __loaderScrollLockCount = 0;
    document.body.style.overflow = document.body.dataset.prevOverflow || '';
    delete document.body.dataset.prevOverflow;
  }
};

// Props: { message (string), lockScroll (bool) }
function Loader({ message = 'Cargando…', lockScroll = true }) {
  useEffect(() => {
    if (lockScroll) {
      lockBodyScroll();
      return () => unlockBodyScroll();
    }
  }, [lockScroll]);

  const overlay = (
    <div
      className="loader-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <video autoPlay muted loop playsInline preload="auto" className="loader-animation">
        <source src="/Loading.webm" type="video/webm" />
      </video>
      <span className="sr-only">{message}</span>
    </div>
  );

  // Render como portal para asegurar overlay global sobre stacking contexts
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(overlay, document.body);
  }
  return overlay;
}

export default Loader;