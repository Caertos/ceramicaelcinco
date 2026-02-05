import { useState, useEffect, useCallback } from 'react';
import AuthContext from './_internalAuthContextRef';
import { http } from '../services/http';

/* =============================================================
   Resumen: Contexto global de autenticación que centraliza
            usuario, rol y estado de carga + utilidades login/refresh/logout.
   Diccionario:
     - refreshAuth: Revalida sesión contra backend (check_auth -> fallback login.php)
     - isAuthenticated: Boolean derivado de tener user cargado.
   ============================================================= */
// Contexto importado de referencia interna para permitir separación de hook

export function AuthProvider({ children }) {
  // Inicializar con posibles valores en sessionStorage para reducir parpadeos
  let initialUser = null; let initialRole = 'user';
  try {
    initialUser = sessionStorage.getItem('auth_user');
    initialRole = sessionStorage.getItem('auth_role') || 'user';
  } catch { /* ignore */ }
  const [user, setUser] = useState(initialUser);
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(true);

  const applyAuthPayload = (payload) => {
    if (!payload) return false;
    const u = payload.user || payload.data?.user;
    const r = payload.role || payload.data?.role;
    if (u) setUser(u);
    if (r) setRole(r);
    return !!u;
  };

  const refreshAuth = useCallback(async () => {
    // Si ya hay user inicial y no hemos validado todavía, haremos una validación rápida en background.
    if (!user) setLoading(true);
    let ok = false;
    // Primer intento: check_auth
    try {
      const resp = await http.get('/endpoints/check_auth.php');
      if (resp?.authenticated) {
        ok = applyAuthPayload(resp);
      }
    } catch { /* ignorar */ }
    // Fallback login.php si el anterior no autenticó
    if (!ok) {
      try {
        const alt = await http.get('/endpoints/login.php');
        if (alt?.authenticated) {
          ok = applyAuthPayload(alt);
        } else {
          setUser(null); setRole('user');
        }
      } catch {
        setUser(null); setRole('user');
      }
    }
    setLoading(false);
    return ok;
  }, [user]);

  useEffect(() => { refreshAuth(); }, [refreshAuth]);

  const logout = useCallback(async () => {
    try { await http.get('/endpoints/logout.php'); } catch { /* ignore */ }
    try {
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_role');
    } catch { /* ignore */ }
    setUser(null); setRole('user');
  }, []);

  const value = {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    refreshAuth,
    logout,
    // Nombre: loginSuccess
    // Proceso: Permite a la vista de login establecer estado auth inmediatamente (evita parpadeos mientras se valida cookie de sesión).
    loginSuccess: (u, r = 'user', newCsrf) => {
      try { if (u) sessionStorage.setItem('auth_user', u); } catch { /* ignore */ }
      try { sessionStorage.setItem('auth_role', r); } catch { /* ignore */ }
      if (newCsrf) {
        try { sessionStorage.setItem('csrf_token', newCsrf); } catch { /* ignore */ }
      }
      setUser(u);
      setRole(r);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// El hook useAuth ahora vive en useAuth.js para optimizar fast refresh
