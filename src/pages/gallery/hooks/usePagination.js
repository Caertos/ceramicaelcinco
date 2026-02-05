import { useState, useMemo } from "react";

/* =============================================================
   Hook: usePagination
   Resumen: Hook reutilizable para gestionar paginación con cálculos automáticos y slice de datos.
   Diccionario:
     - PAGE_SIZE: Número de elementos por página (configurable).
     - totalPages: Número total de páginas calculado automáticamente.
     - sliceStart: Índice inicial para slice de array.
     - pageItems: Subconjunto de items para la página actual.
     - resetPage: Función para volver a página 1.
   Funciones:
     - useMemo: Optimiza cálculos de paginación para evitar re-renders innecesarios.
     - resetPage(): Resetea paginación a página inicial.
   ============================================================= */
// Nombre de la función: usePagination
// Parámetros: { items: Array, pageSize: number }
// Proceso y salida: Calcula paginación automáticamente, proporciona slice de datos y funciones de control.
export const usePagination = ({ items, pageSize = 6 }) => {
  const [page, setPage] = useState(1);

  const paginationData = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const sliceStart = (page - 1) * pageSize;
    const pageItems = items.slice(sliceStart, sliceStart + pageSize);
    
    return {
      totalPages,
      sliceStart,
      pageItems
    };
  }, [items, page, pageSize]);

  const resetPage = () => {
    setPage(1);
  };

  // Ajustar página si es mayor al total disponible
  if (page > paginationData.totalPages && paginationData.totalPages > 0) {
    setPage(paginationData.totalPages);
  }

  return {
    page,
    setPage,
    resetPage,
    pageSize,
    ...paginationData
  };
};