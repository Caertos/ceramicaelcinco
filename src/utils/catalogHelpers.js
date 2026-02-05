/* =============================================================
   Resumen: Conjunto de funciones puras para inicializar y derivar estado
            del catálogo (categorías, producto seleccionado y URL activa).
   Diccionario:
     - viewUrl: Ruta/URL para visualizar el PDF (embebido o descarga inline).
   ============================================================= */
export function initializeCatalogs(data) {
  // Nombre de la función: initializeCatalogs
  // Parámetros: data (Array<Category>) donde Category { id, items: Product[] }
  // Proceso y salida: Si hay datos, selecciona la primera categoría y su primer
  //   producto; retorna shape: { categories, selectedCategoryId, selectedProductId, currentViewUrl }.
  if (!Array.isArray(data) || data.length === 0) {
    return {
      categories: [],
      selectedCategoryId: null,
      selectedProductId: null,
      currentViewUrl: "",
    };
  }

  const firstCategory = data[0] || {};
  const items = Array.isArray(firstCategory.items) ? firstCategory.items : [];
  const firstItem = items[0] || null;

  return {
    categories: data,
    selectedCategoryId: firstCategory.id ?? null,
    selectedProductId: firstItem?.id ?? null,
    currentViewUrl: firstItem?.viewUrl ?? "",
  };
}

export function getSelectedProduct(categories, categoryId, productId) {
  // Nombre de la función: getSelectedProduct
  // Parámetros:
  //   - categories (Array<Category>) Lista actual completa
  //   - categoryId (string|number) Identificador de la categoría activa
  //   - productId (string|number) Identificador del producto buscado
  // Proceso y salida: Busca categoría y luego producto coincidente; retorna Product o null.
  if (!Array.isArray(categories) || categories.length === 0) return null;
  const cat = categories.find(c => String(c.id) === String(categoryId));
  if (!cat || !Array.isArray(cat.items)) return null;
  return cat.items.find(i => String(i.id) === String(productId)) || null;
}