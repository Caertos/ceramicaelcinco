import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { useMemo } from 'react';

/*
Resumen:
Componente guard que protege rutas privadas: muestra cargando, redirige a /login o renderiza children según autenticación.

Diccionario:
- guard: Patrón que evalúa condiciones (auth) antes de permitir acceso.

Parámetros:
- children (ReactNode): Contenido a renderizar si autenticado.

Proceso y salida:
1. Obtiene { loading, isAuthenticated } del contexto.
2. Si loading: muestra texto de carga.
3. Si no autenticado: <Navigate to="/login" replace />.
4. Si autenticado: retorna children.

Notas:
- Se puede mejorar usando un Loader visual.
- Podría aceptar prop redirectTo.
*/
const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();
  const cached = useMemo(() => {
    try { return sessionStorage.getItem('auth_user'); } catch { return null; }
  }, []);
  if (!isAuthenticated && loading && cached) {
    // Mostrar placeholder mínimo sin forzar texto visible (evita parpadeo brusco)
    return <div style={{minHeight:'40vh'}} />;
  }
  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default ProtectedRoute;