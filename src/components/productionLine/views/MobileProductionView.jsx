import React from 'react';
import MobileCategoriesAccordion from '../categories/MobileCategoriesAccordion';

/* =============================================================
   Componente: MobileProductionView
   Resumen: Vista específica para móviles del componente ProductionLine usando acordeón para categorías/productos.
   Diccionario:
     - MobileCategoriesAccordion: Componente acordeón que maneja categorías y productos en una sola interfaz.
     - responsive: Diseño que se adapta específicamente a pantallas móviles (<=768px).
   Funciones:
     - MobileProductionView(props): Renderiza interfaz móvil con acordeón integrado.
   ============================================================= */
// Nombre de la función: MobileProductionView
// Parámetros: { categories, selectedCategoryId, selectedProductId, onSelectCategory, onSelectProduct }
// Proceso y salida: Renderiza acordeón móvil que combina selección de categorías y productos en una interfaz compacta.
const MobileProductionView = ({
  categories,
  selectedCategoryId,
  selectedProductId,
  onSelectCategory,
  onSelectProduct
}) => {
  return (
    <MobileCategoriesAccordion
      categories={categories}
      selectedCategoryId={selectedCategoryId}
      selectedProductId={selectedProductId}
      onSelectCategory={onSelectCategory}
      onSelectProduct={onSelectProduct}
    />
  );
};

export default MobileProductionView;