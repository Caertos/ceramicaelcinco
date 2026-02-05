import { createPortal } from 'react-dom';
import './confirm.css';

/*
Resumen:
Modal de confirmación controlado para acciones críticas con soporte de estado de carga.

Diccionario:
- backdrop: Capa semitransparente detrás del modal.
- loading: Flag que deshabilita interacciones mientras se procesa.

Parámetros:
- open (bool)
- title (string)
- message (string)
- confirmText (string)
- cancelText (string)
- onConfirm (fn)
- onCancel (fn)
- loading (bool)

Proceso y salida:
1. Si open=false: retorna null.
2. Si open=true: crea portal con overlay y caja modal.
3. Botones invocan onCancel/onConfirm (inhabilitados si loading).
4. Retorna portal montado en document.body.

Notas:
- Falta gestionar foco inicial y cierre por Escape.
- Podría añadirse aria-describedby y aria-labelledby claros.
*/
// Props: { open (bool), title (string), message (string), confirmText (string), cancelText (string), onConfirm (fn), onCancel (fn), loading (bool) }
function ConfirmDialog({ open, title = 'Confirmar', message = '¿Estás seguro?', confirmText = 'Sí', cancelText = 'Cancelar', onConfirm, onCancel, loading = false }) {
  if (!open) return null;
  const body = (
    <div className="confirm-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <button className="confirm-close" aria-label="Cerrar" onClick={() => !loading && onCancel?.()}>×</button>
        <h3 className="confirm-title">{title}</h3>
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={() => onCancel?.()} disabled={loading}>{cancelText}</button>
          <button className="btn btn-danger" onClick={() => onConfirm?.()} disabled={loading}>{loading ? 'Procesando…' : confirmText}</button>
        </div>
      </div>
    </div>
  );
  return createPortal(body, document.body);
}

export default ConfirmDialog;
