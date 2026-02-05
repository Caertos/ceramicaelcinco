import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../../services/http';

/* =============================================================
   Hook: useSessionPolling
   Resumen: Hook para polling inteligente de sesión con detección de actividad del usuario y renovación automática.
   Diccionario:
     - polling: Verificación periódica del estado de la sesión.
     - actividad: Eventos del usuario (mouse, teclado, clicks) que indican uso activo.
     - refresh: Renovación del token de sesión solo si hubo actividad reciente.
     - idle_remaining: Tiempo restante antes de expiración por inactividad.
   Funciones:
     - comprobarSesion(forzarRefresh): Verifica estado de sesión y renueva si es necesario.
     - marcarActividad(): Registra que el usuario está activo.
   ============================================================= */
// Nombre de la función: useSessionPolling
// Parámetros: { role, refreshAuth, mostrarMensaje, intervalo }
// Proceso y salida: Configura polling cada 4 min, detecta actividad, renueva sesión selectivamente y maneja expiración.
export const useSessionPolling = ({ 
  role, 
  refreshAuth, 
  mostrarMensaje, 
  intervalo = 240000 
}) => {
  const navigate = useNavigate();
  const huboActividadRef = useRef(false);

  useEffect(() => {
    let cancel = false;
    let intervalId = null;

    const marcarActividad = () => { 
      huboActividadRef.current = true; 
    };

    // Agregar listeners de actividad
    window.addEventListener('mousemove', marcarActividad);
    window.addEventListener('keydown', marcarActividad);
    window.addEventListener('click', marcarActividad);

    const comprobarSesion = async (forzarRefresh = false) => {
      try {
        const usarRefresh = forzarRefresh || huboActividadRef.current;
        const url = usarRefresh 
          ? '/endpoints/check_auth.php?refresh=1' 
          : '/endpoints/check_auth.php';
        
        let data = null;
        try {
          data = await http.get(url);
        } catch {
          if (cancel) return;
          mostrarMensaje('Sesión expirada. Redirigiendo...', 'error');
          setTimeout(() => { 
            navigate('/login', { replace: true }); 
          }, 1500);
          return;
        }

        if (!data) return;

        // Actualizar role si cambia
        const newRole = data?.role || data?.data?.role;
        if (newRole && newRole !== role) {
          refreshAuth();
        }

        // Aviso de expiración próxima
        if (typeof data.idle_remaining === 'number' && 
            data.idle_remaining < 180 && 
            !huboActividadRef.current) {
          mostrarMensaje('Tu sesión está por expirar por inactividad', 'error');
        }
      } catch {
        // Ignorar fallos transitorios
      } finally {
        // Reiniciar flag de actividad tras cada ciclo
        huboActividadRef.current = false;
      }
    };

    // Llamada inicial (renovamos inmediatamente al cargar el panel)
    comprobarSesion(true);
    intervalId = setInterval(() => comprobarSesion(false), intervalo);

    return () => {
      cancel = true;
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('mousemove', marcarActividad);
      window.removeEventListener('keydown', marcarActividad);
      window.removeEventListener('click', marcarActividad);
    };
  }, [role, navigate, refreshAuth, mostrarMensaje, intervalo]);
};