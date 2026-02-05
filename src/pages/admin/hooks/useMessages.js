import { useState, useCallback } from 'react';

/* =============================================================
   Hook: useMessages
   Resumen: Hook personalizado para gestión de mensajes temporales del sistema con auto-cierre configurable.
   Diccionario:
     - autoCloseTime: Tiempo en ms para cerrar automáticamente el mensaje.
     - message: Estado actual del mensaje { text: string, type: 'success'|'error'|'warning' }.
   Funciones:
     - mostrarMensaje(text, type): Establece un mensaje y programa su auto-cierre.
     - limpiarMensaje(): Limpia inmediatamente el mensaje actual.
   ============================================================= */
// Nombre de la función: useMessages
// Parámetros: autoCloseTime (number, default: 4500ms)
// Proceso y salida: Proporciona estado y funciones para gestionar mensajes temporales con timeout automático.
export const useMessages = (autoCloseTime = 4500) => {
  const [message, setMessage] = useState({ text: '', type: '' });

  const mostrarMensaje = useCallback((text, type = 'success') => {
    setMessage({ text, type });
    if (text && autoCloseTime > 0) {
      setTimeout(() => setMessage({ text: '', type: '' }), autoCloseTime);
    }
  }, [autoCloseTime]);

  const limpiarMensaje = useCallback(() => {
    setMessage({ text: '', type: '' });
  }, []);

  return {
    message,
    mostrarMensaje,
    limpiarMensaje
  };
};