import { useEffect } from 'react';

/* =============================================================
   Hook: useKeyboardEvents
   Resumen: Hook para gestionar eventos de teclado globales en componentes como lightbox o modales.
   Diccionario:
     - global keyboard events: Eventos de teclado que se escuchan a nivel de window.
     - event handlers: Funciones que se ejecutan en respuesta a teclas específicas.
     - cleanup: Limpieza automática de event listeners al cerrar o desmontar.
   Funciones:
     - setupKeyboardHandlers(): Configura listeners para teclas específicas.
     - useEffect cleanup: Remueve listeners automáticamente para prevenir memory leaks.
   ============================================================= */
// Nombre de la función: useKeyboardEvents
// Parámetros: { isOpen, onClose, onPrev, onNext }
// Proceso y salida: Configura event listeners globales para Escape, ArrowLeft, ArrowRight cuando está activo.
export const useKeyboardEvents = ({ isOpen, onClose, onPrev, onNext }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose?.();
          break;
        case 'ArrowLeft':
          onPrev?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, onPrev, onNext]);
};