import { memo } from "react";

/*
Resumen:
Lista de botones de productos para una categoría con estado activo accesible.

Diccionario:
- aria-pressed: Indica selección toggle en botones.

Parámetros:
- items (Array<{id,label,viewUrl}>)
- selectedProductId (id)
- onSelectProduct (fn)
- loading (bool)

Proceso y salida:
1. Si loading: mensaje de estado.
2. Si vacío: mensaje sin productos.
3. Renderiza botones; clic dispara onSelectProduct.

Notas:
- Puede añadirse paginado si items crecen.
*/
// Props: { items (Array), selectedProductId (number|string), onSelectProduct (fn), loading (bool) }
function ProductsSelector({ items, selectedProductId, onSelectProduct, loading }) {
  if (loading) return <p role="status" aria-live="polite">Cargando productos...</p>;
  if (!items || items.length === 0) return <p role="status" aria-live="polite">No hay productos en esta categoría.</p>;

  return (
    <div className="selection-container">
      {items.map((p) => (
        <button
          key={p.id}
          type="button"
          className={p.id === selectedProductId ? "active" : ""}
          aria-pressed={p.id === selectedProductId}
          aria-label={`Seleccionar ${p.label}`}
          onClick={(e) => {
            if (e && typeof e.preventDefault === "function") e.preventDefault();
            if (e && typeof e.stopPropagation === "function") e.stopPropagation();
            onSelectProduct?.(p);
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export default memo(ProductsSelector);
