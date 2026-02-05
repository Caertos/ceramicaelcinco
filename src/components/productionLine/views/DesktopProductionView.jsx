import React from 'react';
import CategoriesList from '../categories/CategoriesList';
import ProductsSelector from '../products/ProductsSelector';
import PdfViewer from '../viewer/PdfViewer';

/* =============================================================
   Componente: DesktopProductionView
   Resumen: Vista específica para escritorio con layout de tres columnas (categorías, productos, visor PDF).
   Diccionario:
     - CategoriesList: Lista de categorías en la columna izquierda.
     - ProductsSelector: Selector de productos en la columna central.
     - PdfViewer: Visor embebido de PDF en la columna derecha.
     - categoryItems: Productos filtrados por categoría seleccionada.
   Funciones:
     - DesktopProductionView(props): Renderiza layout de tres columnas para desktop.
   ============================================================= */
// Nombre de la función: DesktopProductionView
// Parámetros: { categories, selectedCategoryId, selectedProductId, onSelectCategory, onSelectProduct, currentViewUrl, showIframeLoader, stopIframeLoader, loading }
// Proceso y salida: Renderiza interfaz desktop con categorías, productos y visor PDF en layout horizontal optimizado.
const DesktopProductionView = ({
  categories,
  selectedCategoryId,
  selectedProductId,
  onSelectCategory,
  onSelectProduct,
  currentViewUrl,
  showIframeLoader,
  stopIframeLoader,
  loading
}) => {
  const categoryItems = categories.find((c) => c.id === selectedCategoryId)?.items || [];

  return (
    <>
      <CategoriesList
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={onSelectCategory}
      />
      
      <div className="products-section">
        <ProductsSelector
          items={categoryItems}
          selectedProductId={selectedProductId}
          onSelectProduct={onSelectProduct}
          loading={loading}
        />

        <PdfViewer 
          src={currentViewUrl} 
          loading={showIframeLoader} 
          onLoad={() => { stopIframeLoader(); }} 
        />
      </div>
    </>
  );
};

export default DesktopProductionView;