import React, { useEffect, useState, useCallback } from 'react';
import './miniSlidesSection.css';

/*
Resumen:
Administración de MiniSlides (texto, imagen, activo y orden) usados en Home.

Diccionario:
- dragOrder: Lista de IDs representando el nuevo orden.

Parámetros:
- adminService, mostrarMensaje.

Proceso y salida:
1. Carga lista inicial y establece dragOrder.
2. Formulario crea nuevo slide (texto + imagen + activo).
3. Cada item permite editar texto (blur), cambiar imagen, togglear activo, eliminar.
4. Reordenar por drag & drop y guardar orden con API.

Notas:
- Confirmación de eliminación usa window.confirm (podría migrar a modal uniforme).
*/
const MiniSlidesSection = ({ adminService, mostrarMensaje }) => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [nuevaImg, setNuevaImg] = useState(null);
  const [nuevoActivo, setNuevoActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragOrder, setDragOrder] = useState([]);
  const [reordering, setReordering] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.listarMiniSlides();
      setSlides(Array.isArray(data) ? data : []);
      setDragOrder(Array.isArray(data) ? data.map(s => s.id) : []);
    } catch (e) { mostrarMensaje(e.message, 'error'); }
    finally { setLoading(false); }
  }, [adminService, mostrarMensaje]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nuevoTexto.trim()) return;
    try {
      setSaving(true);
  await adminService.crearMiniSlide({ text: nuevoTexto.trim(), image: nuevaImg, active: nuevoActivo });
  setNuevoTexto(''); setNuevaImg(null); setNuevoActivo(true);
      mostrarMensaje('MiniSlide creado');
      cargar();
    } catch (e) { mostrarMensaje(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleActualizar = async (id, text, image, active) => {
    try {
      setSaving(true);
      await adminService.actualizarMiniSlide({ id, text, image, active });
      mostrarMensaje('Actualizado');
      cargar();
    } catch (e) { mostrarMensaje(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('Eliminar este MiniSlide?')) return;
    try { await adminService.eliminarMiniSlide(id); mostrarMensaje('Eliminado'); cargar(); }
    catch (e) { mostrarMensaje(e.message, 'error'); }
  };

  // Drag & Drop order
  const onDragStart = (e, id) => { e.dataTransfer.setData('text/plain', id); };
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = (e, targetId) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!draggedId || draggedId === targetId) return;
    const newOrder = [...dragOrder];
    const from = newOrder.indexOf(draggedId);
    const to = newOrder.indexOf(targetId);
    if (from === -1 || to === -1) return;
    newOrder.splice(from, 1);
    newOrder.splice(to, 0, draggedId);
    setDragOrder(newOrder);
  };

  const guardarOrden = async () => {
    try { setReordering(true); await adminService.reordenarMiniSlides(dragOrder); mostrarMensaje('Orden guardado'); cargar(); }
    catch (e) { mostrarMensaje(e.message, 'error'); }
    finally { setReordering(false); }
  };

  return (
    <div className="mini-slides-admin">
      <h2>Mini Slides (Home)</h2>
      <form onSubmit={handleCrear} className="mini-form">
        <textarea
          placeholder="Texto del slide (máx 500 caracteres)"
          maxLength={500}
          value={nuevoTexto}
          onChange={e => setNuevoTexto(e.target.value)}
          required
        />
        <div className="mini-row">
          <input type="file" accept="image/*" onChange={e => setNuevaImg(e.target.files?.[0] || null)} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.75rem' }}>
            <input type="checkbox" checked={nuevoActivo} onChange={e => setNuevoActivo(e.target.checked)} /> Activo
          </label>
          <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</button>
        </div>
      </form>

      {loading ? <p>Cargando...</p> : (
        <>
          <ul className="mini-slides-list" onDragOver={onDragOver}>
            {dragOrder.map(id => {
              const s = slides.find(sl => sl.id === id);
              if (!s) return null;
              return (
                <li key={s.id}
                  className="mini-slide-item-admin"
                  draggable
                  onDragStart={(e) => onDragStart(e, s.id)}
                  onDrop={(e) => onDrop(e, s.id)}
                >
                  <div className="thumb ar-4-3">
                    {s.image_url ? (
                      <img
                        src={`/endpoints/serve_media.php?p=${encodeURIComponent(s.image_url)}`}
                        alt="thumb"
                        onError={(e) => {
                          e.target.replaceWith(Object.assign(document.createElement('span'), { className: 'no-img', textContent: 'Img error' }));
                        }}
                      />
                    ) : (
                      <span className="no-img">Sin imagen</span>
                    )}
                  </div>
                  <div className="content">
                    <textarea
                      defaultValue={s.text}
                      maxLength={500}
                      onBlur={(e) => {
                        const newText = e.target.value.trim();
                        if (newText && newText !== s.text) handleActualizar(s.id, newText, null, null);
                      }}
                    />
                    <div className="actions">
                      <label className="upload-btn">Cambiar imagen
                        <input type="file" accept="image/*" onChange={e => {
                          const f = e.target.files?.[0]; if (f) handleActualizar(s.id, null, f, null);
                        }} />
                      </label>
                      <label className="toggle-active" style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.7rem' }}>
                        <input type="checkbox" defaultChecked={!!s.active} onChange={(e) => handleActualizar(s.id, null, null, e.target.checked)} /> Activo
                      </label>
                      <button type="button" className="danger" onClick={() => handleEliminar(s.id)}>Eliminar</button>
                    </div>
                  </div>
                  <div className="drag-handle" title="Arrastra para reordenar">↕</div>
                </li>
              );
            })}
          </ul>
          {slides.length > 1 && (
            <button type="button" onClick={guardarOrden} disabled={reordering} className="save-order-btn">
              {reordering ? 'Guardando...' : 'Guardar orden'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default MiniSlidesSection;
