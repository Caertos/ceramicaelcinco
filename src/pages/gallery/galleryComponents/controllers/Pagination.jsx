import React from 'react';
import '../../gallery.css';

/*
Resumen:
Paginador accesible con botones numerados y navegación anterior/siguiente.

Diccionario:
- aria-current: Marca la página activa.

Parámetros:
- totalPages (number)
- page (number)
- setPage (fn)
- show (bool): Controla render.

Proceso y salida:
Si show y totalPages>1: renderiza contenedor con botones; actualiza página al click.

Notas:
- Posible mejora: truncar cuando hay muchas páginas.
*/

const Pagination = ({ totalPages, page, setPage, show }) => {
  if (!show || totalPages <= 1) return null;
  return (
    <div className="gallery-pagination" role="navigation" aria-label="Paginación de galería">
      <button type="button" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} aria-label="Anterior">«</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          className={p === page ? 'active' : ''}
          type="button"
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Ir a la página ${p}`}
          onClick={() => setPage(p)}
        >{p}</button>
      ))}
      <button type="button" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} aria-label="Siguiente">»</button>
    </div>
  );
};

export default Pagination;
