import { memo } from 'react';

/*
Resumen:
Acordeón móvil de categorías que despliega productos y acciones (ver / descargar).

Diccionario:
- silent selection: Selección sin abrir PDF (preparar estado).

Parámetros:
- categories (Array)
- selectedCategoryId (id)
- selectedProductId (id)
- onSelectCategory (fn)
- onSelectProduct (fn)

Proceso y salida:
1. Itera categorías creando triggers botón.
2. Abre panel de productos si coincide selectedCategoryId.
3. Botón de producto: si activo colapsa/deselecciona; si no, selección silent.
4. Acciones: Ver (abre nueva pestaña) y Descargar (descarga directa o viewUrl?dl=1).

Notas:
- Usa hidden para panel cerrado (CSS toggleable).
- Considerar animaciones de expansión.
*/
function MobileCategoriesAccordion({ categories, selectedCategoryId, selectedProductId, onSelectCategory, onSelectProduct }) {
  if (!categories || categories.length === 0) return <p>No hay categorías.</p>;
  return (
    <div className="mobile-accordion" aria-label="Listado de categorías" role="list">
      {categories.map(cat => {
        const open = cat.id === selectedCategoryId;
        return (
          <div key={cat.id} className="mobile-accordion-item" role="listitem" data-cat-id={cat.id}>
            <h3 className="mobile-accordion-header">
              <button
                type="button"
                className="mobile-accordion-trigger"
                aria-expanded={open}
                aria-controls={`panel-cat-${cat.id}`}
                onClick={() => {
                  // Si el acordeón ya está abierto, lo cerramos (pasando null al parent)
                  if (open) {
                    onSelectCategory?.({ id: null, items: [] });
                  } else {
                    onSelectCategory?.(cat);
                  }
                }}
              >
                <span className="cat-label">{cat.name}</span>
                <span aria-hidden="true" className="chevron">{open ? '▾' : '▸'}</span>
              </button>
            </h3>
            <div
              id={`panel-cat-${cat.id}`}
              className="mobile-accordion-panel"
              role="region"
              aria-label={`Productos de ${cat.name}`}
              hidden={!open}
            >
              {open && (cat.items && cat.items.length > 0 ? (
                <ul className="mobile-products" role="list">
                  {cat.items.map(p => {
                    const isActive = p.id === selectedProductId;
                    return (
                      <li key={p.id} role="listitem" className="product-item">
                        <div className={isActive ? 'product-row active' : 'product-row'}>
                          <button
                            type="button"
                            className={isActive ? 'product-btn name-btn active' : 'product-btn name-btn'}
                            aria-pressed={isActive}
                            aria-controls={isActive ? `actions-${p.id}` : undefined}
                            onClick={() => {
                              if (isActive) {
                                // Al hacer clic de nuevo sobre el activo se colapsa (deselecciona)
                                onSelectProduct?.(null, { deselect: true });
                              } else {
                                onSelectProduct?.(p, { silent: true });
                              }
                            }}
                            aria-label={`${isActive ? 'Colapsar' : 'Seleccionar'} ${p.label}${isActive ? ' (activo)' : ''}`}
                          >
                            {p.label}
                          </button>
                          {isActive && (
                            <div
                              id={`actions-${p.id}`}
                              className="product-actions"
                              role="group"
                              aria-label={`Acciones para ${p.label}`}
                            >
                              <button
                                type="button"
                                className="action-btn open-btn"
                                onClick={() => onSelectProduct?.(p)}
                                aria-label={`Abrir PDF de ${p.label} en nueva pestaña`}
                              >
                                Ver
                              </button>
                              <button
                                type="button"
                                className="action-btn download-btn"
                                onClick={() => {
                                  if (p.downloadUrl) {
                                    try {
                                      const a = document.createElement('a');
                                      a.href = p.downloadUrl;
                                      a.download = '';
                                      a.rel = 'noopener';
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                    } catch {
                                      window.open(p.downloadUrl, '_blank', 'noopener');
                                    }
                                  } else if (p.viewUrl) {
                                    window.open(p.viewUrl + (p.viewUrl.includes('?') ? '&' : '?') + 'dl=1', '_blank', 'noopener');
                                  }
                                }}
                                aria-label={`Descargar PDF de ${p.label}`}
                              >
                                Descargar
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="no-products" role="status">Sin productos</p>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(MobileCategoriesAccordion);
