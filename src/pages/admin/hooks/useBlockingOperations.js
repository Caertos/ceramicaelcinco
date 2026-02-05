import { useCallback, useRef } from 'react';
import { useDeferredLoader } from '../../../hooks/useDeferredLoader';

/* =============================================================
   Hook: useBlockingOperations
   Resumen: Hook para envolver operaciones asíncronas en loader bloqueante con contador de operaciones concurrentes.
   Diccionario:
     - blocking: Loader que previene interacción del usuario durante operaciones críticas.
     - pendingOps: Contador de operaciones en curso para mostrar/ocultar loader correctamente.
     - runBlocking: Wrapper que ejecuta función asíncrona con loader automático.
   Funciones:
     - runBlocking(fn): Envuelve función async en loader, maneja concurrencia y cleanup.
   ============================================================= */
// Nombre de la función: useBlockingOperations
// Parámetros: (ninguno)
// Proceso y salida: Proporciona función wrapper que muestra loader durante operaciones async y contador para concurrencia.
export const useBlockingOperations = () => {
  const { 
    showLoader: showBlockingLoader, 
    start: startBlockingLoader, 
    stop: stopBlockingLoader 
  } = useDeferredLoader();
  
  const pendingOpsRef = useRef(0);

  const runBlocking = useCallback(async (fn) => {
    pendingOpsRef.current += 1;
    if (pendingOpsRef.current === 1) {
      startBlockingLoader();
    }
    
    try {
      return await fn();
    } finally {
      pendingOpsRef.current -= 1;
      if (pendingOpsRef.current <= 0) {
        pendingOpsRef.current = 0;
        stopBlockingLoader();
      }
    }
  }, [startBlockingLoader, stopBlockingLoader]);

  return {
    showBlockingLoader,
    runBlocking
  };
};