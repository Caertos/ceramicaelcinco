import { memo } from "react";
import { useCatalogState } from "../../pages/products/hooks/useCatalogState";
import { useCatalogSelection } from "../../pages/products/hooks/useCatalogSelection";
import { useMediaQuery } from "../../utils/useMediaQuery";
// Componentes UI
import Loader from "../common/Loader";
import MobileProductionView from "./views/MobileProductionView";
import DesktopProductionView from "./views/DesktopProductionView";

import "./productionLine.css";

/* =============================================================
   Componente: ProductionLine (Refactorizado)
   Resumen: Flujo de selección catálogo -> producto -> visor PDF con arquitectura modular usando hooks especializados.
   Diccionario:
     - catalogState: Estado completo del catálogo gestionado por hook dedicado.
     - selectionLogic: Lógica de selección extraída en hook reutilizable.
     - responsive views: Componentes específicos para mobile/desktop con lógica separada.
     - hooks modulares: Separación de responsabilidades en hooks especializados.
   Funciones:
     - ProductionLine({ onPdfSelect, selectedPdf }): Coordina hooks y renderiza vista según breakpoint.
   ============================================================= */
// Nombre de la función: ProductionLine
// Parámetros: { onPdfSelect: Function, selectedPdf: string }
// Proceso y salida: 
// 1. Utiliza hooks especializados para estado y selección de catálogos.
// 2. Detecta breakpoint y renderiza vista apropiada (mobile/desktop).
// 3. Coordina comunicación entre hooks y componentes de vista.
// Refactorización: Código más modular, testeable y mantenible.

// Constante de breakpoint para mantener DRY si se reutiliza
const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

function ProductionLine({ onPdfSelect, selectedPdf }) {
  // breakpoint móvil <=768px (escucha reactiva)
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  
  // Hook para gestionar estado completo del catálogo
  const catalogState = useCatalogState(onPdfSelect);
  
  // Hook para lógica de selección con comportamiento responsive
  const selectionLogic = useCatalogSelection({
    catalogState,
    onPdfSelect,
    selectedPdf,
    isMobile
  });

  const {
    categories,
    selectedCategoryId,
    selectedProductId,
    currentViewUrl,
    loading,
    error,
    showInitialLoader
  } = catalogState;

  const {
    handleSelectCategory,
    handleSelectProduct,
    showIframeLoader,
    stopIframeLoader
  } = selectionLogic;

  return (
    <section className="production-container" aria-busy={loading}>
      {showInitialLoader && <Loader message="Cargando catálogo…" />}
      {!loading && error && (
        <p className="error" role="alert">Error: {error}</p>
      )}

      {!loading && !error && (
        isMobile ? (
          <MobileProductionView
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            selectedProductId={selectedProductId}
            onSelectCategory={handleSelectCategory}
            onSelectProduct={handleSelectProduct}
          />
        ) : (
          <DesktopProductionView
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            selectedProductId={selectedProductId}
            onSelectCategory={handleSelectCategory}
            onSelectProduct={handleSelectProduct}
            currentViewUrl={currentViewUrl}
            showIframeLoader={showIframeLoader}
            stopIframeLoader={stopIframeLoader}
            loading={loading}
          />
        )
      )}
    </section>
  );
}

export default memo(ProductionLine);
