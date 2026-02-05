import { useCallback, useEffect } from 'react';
import { useDeferredLoader } from '../../../hooks/useDeferredLoader';

/* =============================================================
   Hook: useCatalogSelection
   Resumen: Hook para gestionar la lógica de selección de categorías y productos con comportamiento diferenciado mobile/desktop.
   Diccionario:
     - handleSelectCategory: Selecciona categoría y auto-selecciona primer producto.
     - handleSelectProduct: Gestiona selección de productos con opciones (silent, deselect).
     - silent: Modo para seleccionar sin abrir PDF (útil en móvil).
     - deselect: Opción para deseleccionar producto actual.
     - isMobile: Flag que determina comportamiento (iframe vs nueva pestaña).
   Funciones:
     - handleSelectCategory(cat): Selecciona categoría y primer producto disponible.
     - handleSelectProduct(product, options): Selecciona producto con opciones avanzadas.
     - syncExternalPdf(): Sincroniza cambios externos del PDF seleccionado.
   ============================================================= */
// Nombre de la función: useCatalogSelection
// Parámetros: { catalogState, onPdfSelect, selectedPdf, isMobile }
// Proceso y salida: Proporciona handlers para selección con lógica diferenciada por plataforma y sincronización externa.
export const useCatalogSelection = ({ 
  catalogState, 
  onPdfSelect, 
  selectedPdf, 
  isMobile 
}) => {
  const {
    currentViewUrl,
    setSelectedCategoryId,
    setSelectedProductId,
    setCurrentViewUrl
  } = catalogState;

  const { showLoader: showIframeLoader, start: startIframeLoader, stop: stopIframeLoader } = useDeferredLoader();

  // Sincronización externa: si parent cambia selectedPdf forzamos visor (desktop)
  useEffect(() => {
    if (selectedPdf && selectedPdf !== currentViewUrl) {
      startIframeLoader();
      setCurrentViewUrl(selectedPdf);
    }
  }, [selectedPdf, currentViewUrl, startIframeLoader, setCurrentViewUrl]);

  /**
   * Selecciona una categoría y activa su primer producto (si existe).
   * En mobile no se abre el PDF directamente (sólo se prepara la selección).
   */
  const handleSelectCategory = useCallback((cat) => {
    // Permite cerrar acordeón mobile enviando { id: null }
    if (!cat || cat.id == null) {
      setSelectedCategoryId(null);
      setSelectedProductId(null);
      setCurrentViewUrl("");
      if (!isMobile) stopIframeLoader();
      return;
    }
    
    setSelectedCategoryId(cat.id);
    const first = cat.items?.[0];
    
    if (first) {
      const pdfChanged = first.viewUrl !== currentViewUrl;
      setSelectedProductId(first.id);
      
      if (pdfChanged) {
        setCurrentViewUrl(first.viewUrl);
        if (typeof onPdfSelect === "function") {
          onPdfSelect(first.viewUrl);
        }
        if (!isMobile) {
          startIframeLoader();
        }
      } else {
        // Mismo PDF: no forzar loader perpetuo
        if (!isMobile) {
          stopIframeLoader();
        }
      }
    } else {
      setSelectedProductId(null);
      setCurrentViewUrl("");
      if (!isMobile) stopIframeLoader();
    }
  }, [
    onPdfSelect, 
    currentViewUrl, 
    isMobile, 
    startIframeLoader, 
    stopIframeLoader,
    setSelectedCategoryId,
    setSelectedProductId,
    setCurrentViewUrl
  ]);

  /**
   * Selección de producto.
   * - Mobile: modo silent = sólo seleccionar; modo normal abre en nueva pestaña.
   * - Desktop: embebe en iframe (force-rerender si el mismo PDF). 
   */
  const handleSelectProduct = useCallback((p, options = {}) => {
    if (options.deselect) {
      setSelectedProductId(null);
      return;
    }
    if (!p) return;
    
    let sameProduct = false;
    setSelectedProductId(prev => {
      sameProduct = prev === p.id;
      return p.id;
    });
    
    if (!p.viewUrl) return;
    const silent = Boolean(options.silent);

    if (isMobile) {
      if (silent) {
        setCurrentViewUrl(p.viewUrl);
        if (typeof onPdfSelect === 'function') onPdfSelect(p.viewUrl);
        return;
      }
      window.open(p.viewUrl, '_blank', 'noopener,noreferrer');
      setCurrentViewUrl(p.viewUrl);
      if (typeof onPdfSelect === 'function') onPdfSelect(p.viewUrl);
      return;
    }

    // Desktop
    const pdfChanged = p.viewUrl !== currentViewUrl;
    if (pdfChanged) {
      startIframeLoader();
      setCurrentViewUrl(p.viewUrl);
      if (typeof onPdfSelect === "function") {
        onPdfSelect(p.viewUrl);
      }
    } else if (!pdfChanged && sameProduct) {
      stopIframeLoader();
    }
  }, [
    onPdfSelect, 
    currentViewUrl, 
    isMobile, 
    startIframeLoader, 
    stopIframeLoader,
    setSelectedProductId,
    setCurrentViewUrl
  ]);

  return {
    handleSelectCategory,
    handleSelectProduct,
    showIframeLoader,
    stopIframeLoader
  };
};