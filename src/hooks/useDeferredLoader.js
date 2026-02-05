/* =============================================================
   Hook: useDeferredLoader
   Resumen: Gestiona un indicador de carga basado en un contador de
            operaciones concurrentes. Muestra loader mientras el conteo > 0.
   Diccionario:
     - withLoader: Wrapper que ejecuta una promesa incrementando/decrementando automáticamente.
   API Ejemplo:
     const { showLoader, loading, start, stop, withLoader } = useDeferredLoader({ autoStart });
   Parámetros hook:
     - autoStart (boolean=false): Si true inicia el contador en 1.
   Retorno:
     - showLoader / loading (boolean), start(), stop(), withLoader(fn).
   Nota: Operaciones ultrarrápidas pueden producir parpadeo breve.
   ============================================================= */

import { useCallback, useEffect, useRef, useState } from 'react';

// Nombre de la función: useDeferredLoader
// Parámetros: { autoStart? }.
// Proceso y salida: Inicializa contador; expone helpers para controlar visibilidad del loader.
export function useDeferredLoader({ autoStart = false } = {}) {
  const [showLoader, setShowLoader] = useState(autoStart);
  const [loading, setLoading] = useState(autoStart);
  const activeCountRef = useRef(autoStart ? 1 : 0);

  // Nombre interno: start
  // Proceso y salida: Incrementa contador; si transiciona 0->1 activa flags.
  const start = useCallback(() => {
    activeCountRef.current += 1;
    if (activeCountRef.current === 1) {
      setShowLoader(true);
      setLoading(true);
    }
  }, []);

  // Nombre interno: stop
  // Proceso y salida: Decrementa; si llega a 0 apaga flags.
  const stop = useCallback(() => {
    if (activeCountRef.current === 0) return;
    activeCountRef.current -= 1;
    if (activeCountRef.current === 0) {
      setLoading(false);
      setShowLoader(false);
    }
  }, []);

  // Nombre interno: withLoader
  // Parámetros: fn (async/sync)
  // Proceso y salida: start → ejecutar fn → stop en finally. Devuelve resultado de fn.
  const withLoader = useCallback(async (fn) => {
    start();
    try {
      return await fn();
    } finally {
      stop();
    }
  }, [start, stop]);

  useEffect(() => {
    // Si se pasa de no autoStart a autoStart dinámicamente
    if (autoStart && activeCountRef.current === 0) {
      activeCountRef.current = 1;
      setShowLoader(true);
      setLoading(true);
    }
  }, [autoStart]);

  return { showLoader, loading, start, stop, withLoader };
}

export default useDeferredLoader;
