import { useState, useEffect } from 'react';
import { useDeferredLoader } from '../../../hooks/useDeferredLoader';
import { getCatalogs } from '../../../services/catalogService';
import { initializeCatalogs } from '../../../utils/catalogHelpers';

/* =============================================================
   Hook: useCatalogState
   Resumen: Hook para gestionar el estado completo de catálogos con carga inicial y manejo de errores.
   Diccionario:
     - categories: Lista normalizada de categorías con sus productos { id, name, items[] }.
     - selectedCategoryId: ID de la categoría actualmente seleccionada.
     - selectedProductId: ID del producto actualmente seleccionado.
     - currentViewUrl: URL del PDF que se está mostrando actualmente.
     - initializeCatalogs: Función que normaliza datos y establece selecciones iniciales.
   Funciones:
     - loadCatalogs(): Carga asíncrona de catálogos desde API con abort controller.
     - setters: Funciones para actualizar cada parte del estado.
   ============================================================= */
// Nombre de la función: useCatalogState
// Parámetros: onPdfSelect (función callback opcional)
// Proceso y salida: Carga datos iniciales, normaliza estado y proporciona setters para gestión completa del catálogo.
export const useCatalogState = (onPdfSelect) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [currentViewUrl, setCurrentViewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { showLoader: showInitialLoader, start: startInitialLoader, stop: stopInitialLoader } = useDeferredLoader();

  // Carga inicial de catálogos (solo una vez)
  useEffect(() => {
    let mounted = true;
    const ctrl = new AbortController();
    
    async function loadCatalogs() {
      try {
        setLoading(true);
        startInitialLoader();
        setError("");

        const catalogsData = await getCatalogs({ signal: ctrl.signal });
        if (!mounted) return;

        const initialCatalogState = initializeCatalogs(catalogsData);

        if (!mounted) return;
        setCategories(initialCatalogState.categories);
        setSelectedCategoryId(initialCatalogState.selectedCategoryId);
        setSelectedProductId(initialCatalogState.selectedProductId);
        setCurrentViewUrl(initialCatalogState.currentViewUrl);

        if (initialCatalogState.currentViewUrl && typeof onPdfSelect === "function") {
          onPdfSelect(initialCatalogState.currentViewUrl);
        }

      } catch (err) {
        if (mounted && err?.name !== 'AbortError') {
          setError(err.message || "Error al cargar datos");
        }
      } finally {
        if (mounted) {
          setLoading(false);
          stopInitialLoader();
        }
      }
    }
    
    loadCatalogs();
    
    return () => {
      mounted = false;
      ctrl.abort();
    };
  }, [onPdfSelect, startInitialLoader, stopInitialLoader]);

  return {
    // Estado
    categories,
    selectedCategoryId,
    selectedProductId,
    currentViewUrl,
    loading,
    error,
    showInitialLoader,
    
    // Setters
    setCategories,
    setSelectedCategoryId,
    setSelectedProductId,
    setCurrentViewUrl,
    setLoading,
    setError
  };
};