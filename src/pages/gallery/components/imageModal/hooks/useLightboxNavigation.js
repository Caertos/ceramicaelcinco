import { useCallback } from 'react';

/* =============================================================
   Hook: useLightboxNavigation
   Resumen: Hook para gestionar navegación circular en lightbox con sincronización automática de paginación.
   Diccionario:
     - global index: Índice absoluto sobre toda la colección de items.
     - local index: Índice relativo dentro de la página actual.
     - circular navigation: Navegación que permite ir del último al primer elemento y viceversa.
     - page synchronization: Actualización automática de página cuando navegación cruza límites.
   Funciones:
     - prev(): Navega al elemento anterior con cálculo circular y actualización de página.
     - next(): Navega al elemento siguiente con cálculo circular y actualización de página.
     - calculateNavigation(direction): Lógica común para ambas direcciones de navegación.
   ============================================================= */
// Nombre de la función: useLightboxNavigation
// Parámetros: { lightboxIndex, items, sliceStart, pageSize, page, setPage, setLightboxIndex }
// Proceso y salida: Proporciona funciones prev/next con navegación circular inteligente y sincronización de paginación.
export const useLightboxNavigation = ({
  lightboxIndex,
  items,
  sliceStart,
  pageSize,
  page,
  setPage,
  setLightboxIndex
}) => {
  const calculateNavigation = useCallback((direction) => {
    if (lightboxIndex === null || items.length < 2) return;
    
    const currentGlobal = sliceStart + lightboxIndex;
    const newGlobal = direction === 'next' 
      ? (currentGlobal + 1) % items.length
      : (currentGlobal - 1 + items.length) % items.length;
    
    const newPage = Math.floor(newGlobal / pageSize) + 1;
    const newLocal = newGlobal % pageSize;
    
    if (newPage !== page) {
      setPage(newPage);
    }
    setLightboxIndex(newLocal);
  }, [lightboxIndex, items.length, sliceStart, pageSize, page, setPage, setLightboxIndex]);

  const prev = useCallback(() => {
    calculateNavigation('prev');
  }, [calculateNavigation]);

  const next = useCallback(() => {
    calculateNavigation('next');
  }, [calculateNavigation]);

  return {
    prev,
    next,
    canNavigate: items.length >= 2
  };
};