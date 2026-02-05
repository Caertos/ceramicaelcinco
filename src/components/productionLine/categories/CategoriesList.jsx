import { memo } from "react";

/*
Resumen:
Lista de tarjetas de categorías clicables con soporte teclado y estado activo.

Diccionario:
- aria-pressed: Indica selección en control tipo botón.

Parámetros:
- categories (Array<{id,name,imageUrl}>)
- selectedCategoryId (id)
- onSelectCategory (fn)

Proceso y salida:
1. Si vacío: mensaje sin categorías.
2. Renderiza contenedor role=list con tarjetas.
3. Clic o Enter seleccionan categoría y llaman onSelectCategory.

Notas:
- Podría soportar lazy load de imágenes (ya usa loading="lazy").
*/
// Props: { categories (Array), selectedCategoryId (number|string), onSelectCategory (fn) }
function CategoriesList({ categories, selectedCategoryId, onSelectCategory }) {
  if (!categories || categories.length === 0) {
    return <p>No hay categorías.</p>;
  }

  return (
    <div className="production-line" role="list" aria-label="Lista de categorías de productos">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className={`category-card ${cat.id === selectedCategoryId ? "active-category" : ""}`}
          onClick={(e) => {
            if (e?.preventDefault) e.preventDefault();
            if (e?.stopPropagation) e.stopPropagation();
            onSelectCategory?.(cat);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelectCategory?.(cat)}
        >
          <img src={cat.imageUrl} alt={cat.name} loading="lazy" decoding="async" aria-label={`Imagen de categoría ${cat.name}`} />
          <button
            type="button"
            className={cat.id === selectedCategoryId ? "active-category" : ""}
            aria-pressed={cat.id === selectedCategoryId}
            aria-label={`Seleccionar categoría ${cat.name}`}
            onClick={(e) => {
              if (e && typeof e.preventDefault === "function") e.preventDefault();
              if (e && typeof e.stopPropagation === "function") e.stopPropagation();
              onSelectCategory?.(cat);
            }}
          >
            {cat.name}
          </button>
        </div>
      ))}
    </div>
  );
}

export default memo(CategoriesList);
