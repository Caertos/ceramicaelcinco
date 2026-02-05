import { useState, useEffect } from 'react';
/* =============================================================
   Resumen: Hook React para evaluar una media query y actualizar en tiempo
            real un boolean indicando si coincide.
   Diccionario:
     - media query: Expresión CSS que define condiciones de viewport
                    (ancho, orientación, resolución, etc.).
   Parámetros (del hook):
     - query (string) Ej: '(max-width: 768px)'.
   Proceso y salida: Usa window.matchMedia para suscribirse a cambios y
     retorna true/false según coincidencia. Limpia el listener al desmontar.
   ============================================================= */
export function useMediaQuery(query) {
  const getMatch = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else {
      // Safari <14
      mql.addListener(handler);
    }
    setMatches(mql.matches);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler);
      else mql.removeListener(handler);
    };
  }, [query]);

  return matches;
}
