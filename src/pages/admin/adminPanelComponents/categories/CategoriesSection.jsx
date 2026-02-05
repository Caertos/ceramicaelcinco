import React, { useState } from 'react';
import '../../adminPanel.css';

/*
Resumen:
Gestión de categorías: crear, renombrar, subir icono, eliminar (si vacía).

Diccionario:
- productosByCat: Mapa que indica si la categoría contiene productos.

Parámetros:
- categorias (Array)
- productosByCat (Obj)
- onCrear, onEliminar, onRenombrar, onSubirIcono (funciones)
- nuevaCategoria (string), setNuevaCategoria (fn)

Proceso y salida:
Renderiza formulario creación + tabla editable con acciones (guardar nombre, subir icono, eliminar). Controla loading por fila.

Notas:
- Eliminación bloqueada si hay productos asociados.
*/

const CategoriesSection = ({ categorias, productosByCat, onCrear, onEliminar, nuevaCategoria, setNuevaCategoria, onRenombrar, onSubirIcono }) => {
  const [editNames, setEditNames] = useState({});
  const [loadingById, setLoadingById] = useState({});
  return (
    <section className="admin-section">
      <h2>Categorías</h2>
      <form onSubmit={onCrear} className="admin-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Nombre de la categoría"
            value={nuevaCategoria}
            onChange={e => setNuevaCategoria(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={!nuevaCategoria?.trim()}>Crear Categoría</button>
      </form>
      <table className="admin-table" aria-label="Lista de categorías">
        <thead><tr><th>ID</th><th>Nombre</th><th>Icono</th><th>Acciones</th></tr></thead>
        <tbody>
          {categorias.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>
                <input
                  type="text"
                  value={editNames[c.id] ?? c.nombre}
                  onChange={e => setEditNames(s => ({ ...s, [c.id]: e.target.value }))}
                  style={{ minWidth: 180 }}
                />
              </td>
              <td>
                {c.catIcon_url ? (
                  <img src={`/endpoints/serve_media.php?p=${encodeURIComponent(c.catIcon_url)}`} alt={c.nombre} style={{ maxWidth: 80, maxHeight: 50, objectFit: 'cover' }} />
                ) : (
                  <span className="muted">—</span>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    aria-label={`Subir icono para la categoría ${c.nombre}`}
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setLoadingById(s => ({ ...s, [c.id]: true }));
                      try { await onSubirIcono?.(c.id, f); } finally { setLoadingById(s => ({ ...s, [c.id]: false })); }
                    }}
                  />
                </div>
              </td>
              <td>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={async () => {
                    const nuevo = (editNames[c.id] ?? c.nombre).trim();
                    if (!nuevo || nuevo === c.nombre) return;
                    setLoadingById(s => ({ ...s, [c.id]: true }));
                    try { await onRenombrar?.(c.id, nuevo); } finally { setLoadingById(s => ({ ...s, [c.id]: false })); }
                  }}
                  disabled={loadingById[c.id]}
                >{loadingById[c.id] ? 'Guardando...' : 'Guardar nombre'}</button>
                {!productosByCat[c.id]?.length ? (
                  <button className="btn btn-danger" onClick={() => onEliminar(c.id, c.nombre)} disabled={loadingById[c.id]}>Eliminar</button>
                ) : <span className="message-error">Contiene productos</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default CategoriesSection;
