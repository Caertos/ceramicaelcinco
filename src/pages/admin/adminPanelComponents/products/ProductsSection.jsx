import React, { useState, useEffect, useMemo } from 'react';
import '../../adminPanel.css';
import './productsSection.css';

/* =============================================================
   Componente: ProductsSection
   Resumen: Administra productos (listar, crear, renombrar, reemplazar PDF y eliminar) filtrados por categoría seleccionada.
   Diccionario:
     - catActiva: ID de categoría actualmente seleccionada para filtrar productos.
     - productosByCat: Mapa { categoriaId: Producto[] } usado como cache local.
     - listaProductos: Lista derivada de productos para catActiva (acepta clave numérica o string).
   Funciones:
     - useEffect(init cat): Selecciona la primera categoría disponible si no hay una activa.
     - useEffect(sync cat): Verifica existencia de catActiva tras cambios (ej. eliminación) y reasigna.
     - onCrear (prop): Handler externo para creación (usa form controlado).
     - onRenombrar (prop): Renombra producto (botón Guardar).
     - onReemplazar (prop): Reemplaza archivo PDF asociado.
     - onEliminar (prop): Elimina producto (confirmación externa asumida o simple).
   ============================================================= */

const ProductsSection = ({
  categorias = [],
  productosByCat = {},
  nuevoProducto,
  setNuevoProducto,
  onCrear,
  onEliminar,
  onReemplazar,
  onRenombrar,
  catActiva,
  setCatActiva
}) => {
  // Selección inicial
  useEffect(() => {
    if ((catActiva == null || Number.isNaN(Number(catActiva))) && categorias.length) {
      setCatActiva(Number(categorias[0].id));
    }
  }, [catActiva, categorias, setCatActiva]);

  // Si la categoría activa desaparece
  useEffect(() => {
    if (catActiva != null && categorias.length) {
      const existe = categorias.some(c => Number(c.id) === Number(catActiva));
      if (!existe) {
        setCatActiva(categorias.length ? Number(categorias[0].id) : null);
      }
    }
  }, [catActiva, categorias, setCatActiva]);

  const [editNames, setEditNames] = useState({});
  const [loadingById, setLoadingById] = useState({});

  const listaProductos = useMemo(() => {
    if (catActiva == null) return [];
    return productosByCat[catActiva] || productosByCat[String(catActiva)] || [];
  }, [catActiva, productosByCat]);

  return (
    <section className="admin-section">
      <h2>Productos</h2>

      <form onSubmit={onCrear} className="admin-form">
        <div className="form-group">
          <label>Categoría:</label>
          <select
            value={nuevoProducto.categoria_id}
            onChange={e => setNuevoProducto(p => ({ ...p, categoria_id: e.target.value }))}
            required
          >
            <option value="">-- Seleccione --</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Nombre del producto:</label>
          <input
            type="text"
            value={nuevoProducto.nombre}
            onChange={e => setNuevoProducto(p => ({ ...p, nombre: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label>Archivo PDF:</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={e => setNuevoProducto(p => ({ ...p, archivo: e.target.files[0] }))}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!nuevoProducto.categoria_id || !nuevoProducto.nombre?.trim() || !nuevoProducto.archivo}
        >Agregar Producto</button>
      </form>

      <div className="tabs-categorias">
        {categorias.map(c => {
          const cidNum = Number(c.id);
            const active = catActiva != null && Number(catActiva) === cidNum;
            return (
              <button
                key={c.id}
                type="button"
                data-active={active ? '1' : '0'}
                className={active ? 'sel-cat-btn selected' : 'sel-cat-btn'}
                onClick={() => setCatActiva(cidNum)}
              >
                {c.nombre}
              </button>
            );
          })}
      </div>

      {listaProductos.length === 0 ? (
        <p className="no-products">No hay productos en esta categoría.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Archivo</th>
              <th>Subido</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaProductos.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>
                  <input
                    type="text"
                    value={editNames[p.id] ?? p.nombre}
                    onChange={e => setEditNames(s => ({ ...s, [p.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={async () => {
                      const nuevo = (editNames[p.id] ?? p.nombre).trim();
                      if (!nuevo || nuevo === p.nombre) return;
                      setLoadingById(s => ({ ...s, [p.id]: true }));
                      try { await onRenombrar?.(p.id, nuevo); } finally { setLoadingById(s => ({ ...s, [p.id]: false })); }
                    }}
                    disabled={loadingById[p.id]}
                  >{loadingById[p.id] ? 'Guardando...' : 'Guardar'}</button>
                </td>
                <td>
                  <a
                    href={`${import.meta.env?.VITE_API_URL || ''}/endpoints/download.php?id=${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ver PDF de ${p.nombre || p.id}`}
                    className="btn btn-secondary"
                  >Ver</a>
                </td>
                <td>{p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</td>
                <td className="actions">
                  <div className="file-input-wrapper">
                    <label className="btn btn-secondary" style={{ position: 'relative', cursor: 'pointer' }}>
                      Cambiar Ficha
                      <input
                        type="file"
                        accept="application/pdf"
                        className="visualmente-hidden"
                        aria-label={`Seleccionar nuevo PDF para ${p.nombre}`}
                        onChange={async e => {
                          const f = e.target.files[0];
                          if (!f) return;
                          setLoadingById(s => ({ ...s, [p.id]: true }));
                          try { await onReemplazar(p.id, f); } finally { setLoadingById(s => ({ ...s, [p.id]: false })); }
                        }}
                      />
                    </label>
                  </div>
                  <button
                    className="btn btn-danger"
                    onClick={() => onEliminar(p.id, p.nombre)}
                    disabled={loadingById[p.id]}
                  >Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default ProductsSection;
