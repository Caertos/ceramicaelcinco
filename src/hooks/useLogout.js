import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

/* =============================================================
   Hook: useLogout
   Resumen: Expone una función para cerrar sesión limpiando contexto,
            almacenamiento (claves relevantes) y redirigiendo opcionalmente.
   Diccionario:
     - redirect: Indica si se navega tras logout.
     - replace: Usa history.replace en lugar de push.
   Parámetros (al invocar la función retornada): { redirect?, to?, replace? }
   Retorno: (fn) => Promise<void>
   ============================================================= */
export default function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useCallback(async (opts = {}) => {
    const { redirect = true, to = '/login', replace = true } = opts;
    try { await logout(); } catch { /* ignore */ }
    // Limpieza defensiva extra (en caso de que contexto cambie implementación)
    try {
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_role');
      // No eliminamos csrf_token para permitir flujo de login inmediato si backend lo reutiliza
    } catch { /* ignore */ }
    if (redirect) navigate(to, { replace });
  }, [logout, navigate]);
}
