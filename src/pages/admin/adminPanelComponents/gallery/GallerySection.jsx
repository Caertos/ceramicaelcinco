import React, { useState, useEffect, useCallback } from 'react';
import { useDeferredLoader } from '../../../../hooks/useDeferredLoader';
import '../../adminPanel.css';
import Loader from '../../../../components/common/Loader';
import ConfirmDialog from '../../../../components/common/ConfirmDialog';

/*
Resumen:
Sección de administración de galería: subir, listar, renombrar y eliminar imágenes/videos con paginación y filtrado por tipo.

Diccionario:
- pageItems: Subconjunto paginado de galeriaArchivos.
- showUploadLoader: Loader diferido para operaciones de subida.

Parámetros:
- mostrarMensaje (fn)
- adminService (obj)

Proceso y salida:
1. Monta: carga inicial del tipo actual.
2. Formulario permite subir archivo con nombre y tipo.
3. Filtro tipo y controles de paginación.
4. Tabla editable (renombrar / eliminar) con confirmación.

Notas:
- Paginación client-side; considerar server-side si escala.
*/

const PAGE_SIZES = [5, 10, 15];

const GallerySection = ({ mostrarMensaje, adminService }) => {
  const [nuevoArchivoGaleria, setNuevoArchivoGaleria] = useState({ nombre: '', tipo: 'foto', archivo: null });
  const [galeriaTipo, setGaleriaTipo] = useState('foto');
  const [galeriaArchivos, setGaleriaArchivos] = useState([]);
  const [editNames, setEditNames] = useState({});
  const [loadingById, setLoadingById] = useState({});
  const [loadingGaleria, setLoadingGaleria] = useState(false);
  const { showLoader: showUploadLoader, start: startUpload, stop: stopUpload } = useDeferredLoader();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(galeriaArchivos.length / pageSize));
  const sliceStart = (page - 1) * pageSize;
  const pageItems = galeriaArchivos.slice(sliceStart, sliceStart + pageSize);

  const cargarGaleria = useCallback(async (tipo = galeriaTipo) => {
    try {
      setLoadingGaleria(true);
      const archivos = await adminService.obtenerGaleria(tipo);
      setGaleriaArchivos(Array.isArray(archivos) ? archivos : []);
      setPage(1); // reset al cambiar tipo
    } catch {
      mostrarMensaje('Error al cargar galería', 'error');
    } finally {
      setLoadingGaleria(false);
    }
  }, [galeriaTipo, adminService, mostrarMensaje]);

  useEffect(() => { cargarGaleria(); }, [cargarGaleria]);

  const handleSubirGaleria = async e => {
    e.preventDefault();
    if (!nuevoArchivoGaleria.nombre || !nuevoArchivoGaleria.archivo) return;
    try {
      startUpload();
      await adminService.subirGaleria(nuevoArchivoGaleria);
      setNuevoArchivoGaleria({ nombre: '', tipo: 'foto', archivo: null });
      mostrarMensaje('Archivo subido a galería');
      cargarGaleria();
    } catch (e) { mostrarMensaje(e.message, 'error'); }
    finally { stopUpload(); }
  };

  const handleEliminarGaleria = async (id) => {
    // La confirmación se maneja en el onClick para evitar doble alerta
    try {
      await adminService.eliminarGaleria(id);
      mostrarMensaje('Elemento eliminado de la galería');
      cargarGaleria();
    } catch (e) { mostrarMensaje(e.message, 'error'); }
  };

  const cambiarTipo = e => { setGaleriaTipo(e.target.value); };

  const changePage = p => { if (p >= 1 && p <= totalPages) setPage(p); };

  return (
    <section className="admin-section">
  {showUploadLoader && <Loader message="Subiendo archivo…" />}
      <h2>Galería</h2>
      <form onSubmit={handleSubirGaleria} className="admin-form">
        <div className="form-group">
          <label>Nombre (alt):</label>
          <input
            type="text"
            value={nuevoArchivoGaleria.nombre}
            onChange={e => setNuevoArchivoGaleria(s => ({ ...s, nombre: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label>Tipo:</label>
          <select
            value={nuevoArchivoGaleria.tipo}
            onChange={e => setNuevoArchivoGaleria(s => ({ ...s, tipo: e.target.value }))}
          >
            <option value="foto">Imagen</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div className="form-group">
          <label>Archivo:</label>
            <input
              type="file"
              accept={nuevoArchivoGaleria.tipo === 'foto' ? 'image/*' : 'video/*'}
              onChange={e => setNuevoArchivoGaleria(s => ({ ...s, archivo: e.target.files[0] }))}
              required
            />
        </div>
        <button type="submit" className="btn btn-primary">Subir a Galería</button>
      </form>

      <div className="gallery-filter">
        <label>Ver:</label>
        <select value={galeriaTipo} onChange={cambiarTipo}>
          <option value="foto">Imágenes</option>
          <option value="video">Videos</option>
        </select>
        <button type="button" className="btn btn-secondary" style={{ marginLeft: '1rem' }} onClick={() => cargarGaleria()}>Recargar</button>
      </div>

      <div className="pagination-bar">
        <div className="page-size">
          <label>Mostrar:</label>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="pages">
          <button type="button" disabled={page === 1} onClick={() => changePage(page - 1)}>«</button>
          <span>{page} / {totalPages}</span>
          <button type="button" disabled={page === totalPages} onClick={() => changePage(page + 1)}>»</button>
        </div>
      </div>

      {loadingGaleria ? <div>Cargando...</div> : (
        <div className="gallery-list">
          {pageItems.length === 0 ? <p>No hay archivos en la galería.</p> : (
            <table className="admin-table">
              <thead><tr><th>ID</th><th>Nombre</th><th>Archivo</th><th>Subido</th><th>Acciones</th></tr></thead>
              <tbody>
                {pageItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <input
                        type="text"
                        value={editNames[item.id] ?? item.nombre}
                        onChange={e => setEditNames(s => ({ ...s, [item.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={async () => {
                          const nuevo = (editNames[item.id] ?? item.nombre).trim();
                          if (!nuevo) return;
                          setLoadingById(s => ({ ...s, [item.id]: true }));
                          try {
                            await adminService.renombrarGaleria(item.id, nuevo);
                            mostrarMensaje('Nombre actualizado');
                            cargarGaleria();
                          } catch (e) { mostrarMensaje(e.message, 'error'); }
                          finally { setLoadingById(s => ({ ...s, [item.id]: false })); }
                        }}
                        disabled={loadingById[item.id]}
                      >{loadingById[item.id] ? 'Guardando...' : 'Guardar'}</button>
                    </td>
                    <td>
                      {item.tipo === 'foto' ? (
                        <img
                          src={`/endpoints/serve_media.php?p=${encodeURIComponent(item.url)}`}
                          alt={item.nombre}
                          style={{ maxWidth: 110, maxHeight: 70, objectFit: 'cover' }}
                          loading="lazy"
                        />
                      ) : (
                        <video
                          src={`/endpoints/serve_media.php?p=${encodeURIComponent(item.url)}`}
                          controls
                          style={{ maxWidth: 150, maxHeight: 100 }}
                        />
                      )}
                    </td>
                    <td>{item.fecha_subida ? new Date(item.fecha_subida).toLocaleString() : '-'}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => { setPendingDeleteId(item.id); setConfirmOpen(true); }}
                        disabled={loadingById[item.id]}
                      >{loadingById[item.id] ? 'Eliminando...' : 'Eliminar'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar de galería"
        message="¿Eliminar este elemento de la galería?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={pendingDeleteId ? !!loadingById[pendingDeleteId] : false}
        onCancel={() => { if (!pendingDeleteId || !loadingById[pendingDeleteId]) { setConfirmOpen(false); setPendingDeleteId(null); } }}
        onConfirm={async () => {
          if (!pendingDeleteId) return;
          const id = pendingDeleteId;
          setLoadingById(s => ({ ...s, [id]: true }));
          try {
            await handleEliminarGaleria(id);
            setConfirmOpen(false);
            setPendingDeleteId(null);
          } finally {
            setLoadingById(s => ({ ...s, [id]: false }));
          }
        }}
      />
    </section>
  );
};

export default GallerySection;
