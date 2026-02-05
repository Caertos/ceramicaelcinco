import { useEffect, useRef } from 'react';

/* =============================================================
   Hook: useFocusTrap
   Resumen: Hook para implementar focus trap en modales con enfoque inicial automático y navegación circular por elementos.
   Diccionario:
     - focus trap: Técnica de accesibilidad que mantiene el foco dentro del modal.
     - focusable elements: Elementos que pueden recibir foco (buttons, links, inputs, etc.).
     - circular focus: Al llegar al último elemento, Tab va al primero y Shift+Tab va al último.
     - initial focus: Enfoque automático del primer elemento al abrir el modal.
   Funciones:
     - setupInitialFocus(): Enfoca el primer elemento focusable al abrir.
     - handleTabNavigation(e): Gestiona navegación circular con Tab y Shift+Tab.
     - getFocusableElements(): Obtiene lista de elementos focusables dentro del contenedor.
   ============================================================= */
// Nombre de la función: useFocusTrap
// Parámetros: { isOpen: boolean }
// Proceso y salida: Proporciona refs y gestiona focus trap automático cuando el modal está abierto.
export const useFocusTrap = ({ isOpen }) => {
  const containerRef = useRef(null);
  const initialFocusRef = useRef(null);

  // Enfoque inicial al abrir
  useEffect(() => {
    if (!isOpen) return;
    
    const setupInitialFocus = () => {
      if (initialFocusRef.current) {
        initialFocusRef.current.focus();
      }
    };
    
    // Pequeño delay para asegurar que el DOM esté renderizado
    setTimeout(setupInitialFocus, 0);
  }, [isOpen]);

  // Focus trap con navegación circular
  useEffect(() => {
    if (!isOpen) return;

    const handleTabNavigation = (e) => {
      if (e.key !== 'Tab') return;
      
      const container = containerRef.current;
      if (!container) return;
      
      const focusable = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
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

    const container = containerRef.current;
    container?.addEventListener('keydown', handleTabNavigation);
    
    return () => container?.removeEventListener('keydown', handleTabNavigation);
  }, [isOpen]);

  return {
    containerRef,
    initialFocusRef
  };
};