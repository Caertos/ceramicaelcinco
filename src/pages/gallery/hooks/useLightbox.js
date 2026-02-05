import { useState, useEffect } from "react";

/* =============================================================
   Hook: useLightbox
   Resumen: Hook para gestionar estado y comportamiento del lightbox con sincronización automática.
   Diccionario:
     - lightboxIndex: Índice del elemento actual en lightbox (null = cerrado).
     - isLightboxOpen: Booleano derivado del estado del índice.
     - currentItem: Elemento actual mostrado en lightbox.
     - autoClose: Cierre automático cuando cambian condiciones externas.
   Funciones:
     - openLightbox(index): Abre lightbox en índice específico.
     - closeLightbox(): Cierra lightbox reseteando índice.
     - useEffect: Cierre automático en casos de inconsistencia.
   ============================================================= */
// Nombre de la función: useLightbox
// Parámetros: { pageItems: Array, tipoActual: string }
// Proceso y salida: Gestiona estado de lightbox con validaciones automáticas y cierre en cambios de contexto.
export const useLightbox = ({ pageItems, tipoActual }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const isLightboxOpen = lightboxIndex !== null;
  const currentItem = isLightboxOpen ? pageItems[lightboxIndex] : null;

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  // Cerrar o ajustar cuando cambia la página o los elementos visibles
  useEffect(() => {
    if (lightboxIndex !== null && lightboxIndex >= pageItems.length) {
      setLightboxIndex(null);
    }
  }, [pageItems.length, lightboxIndex]);

  // Cerrar lightbox al cambiar tipo (foto/video) para evitar inconsistencias
  useEffect(() => {
    setLightboxIndex(null);
  }, [tipoActual]);

  return {
    lightboxIndex,
    setLightboxIndex,
    isLightboxOpen,
    currentItem,
    openLightbox,
    closeLightbox
  };
};