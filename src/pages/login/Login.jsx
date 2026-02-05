import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import { getRecaptchaToken, getRecaptchaSiteKey } from '../../utils/recaptcha';
import { useAuth } from '../../context/useAuth.js';
import { http } from '../../services/http';

/*
Resumen:
Página de login admin con obtención de CSRF y reCAPTCHA opcional, reintento automático si backend exige verificación.

Diccionario:
- CSRF: Token anti CSRF.
- reCAPTCHA: Servicio antiautomación.

Parámetros:
(Sin props) Estado: username, password, csrf, loading, error, recaptcha.

Proceso y salida:
1. Monta: GET login.php para csrf / flags / sesión existente.
2. Enviar: POST credenciales (+ token recaptcha si requerido).
3. Si backend pide recaptcha y aún no usado: reintento con token.
4. En éxito: guarda usuario/rol/token y navega a /admin.

Notas:
- Mejorar feedback de error según códigos HTTP.
- Posible limitador de intentos (UI) adaptativo.
*/
const Login = () => {
  const navigate = useNavigate();
  const { loginSuccess, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [csrf, setCsrf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const siteKey = getRecaptchaSiteKey();
  const [recaptchaRequired, setRecaptchaRequired] = useState(false);

  // Al montar: pedir csrf y verificar sesión existente
  useEffect(() => {
    const load = async () => {
      try {
        const resp = await http.get('/endpoints/login.php');
        const rootUser = resp?.user || resp?.data?.user;
        const rootRole = resp?.role || resp?.data?.role;
        if (resp?.authenticated && rootUser) {
          try {
            sessionStorage.setItem('auth_user', rootUser);
            sessionStorage.setItem('auth_role', rootRole || 'user');
          } catch { /* ignore */ }
          navigate('/admin', { replace: true });
          return;
        }
        if (resp?.csrf_token) {
          setCsrf(resp.csrf_token);
          try { sessionStorage.setItem('csrf_token', resp.csrf_token); } catch { /* ignore */ }
        }
        if (resp?.recaptcha) setRecaptchaRequired(!!resp.recaptcha.required);
      } catch {
        // Ignorar error de red en init; se puede reintentar al enviar el form
      }
    };
    load();
  }, [navigate]);

  const doLogin = async (forceCaptcha = false) => {
    const body = { username, password, csrf_token: csrf };
    if (forceCaptcha || recaptchaRequired) {
      try {
        const tok = await getRecaptchaToken('login', siteKey);
        if (tok) body.recaptcha_token = tok;
      } catch { /* noop */ }
    }
    const res = await fetch('/endpoints/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return { res, data };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let { res, data } = await doLogin();
      if (!res.ok || !data?.success) {
        if ((data?.recaptcha_required || data?.recaptcha?.required) && siteKey) {
          ({ res, data } = await doLogin(true));
        }
      }
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Error de autenticación');
        return;
      }
      const u = data?.data?.user || data?.user;
      const r = data?.data?.role || data?.role || 'user';
      const rotated = data?.data?.new_csrf_token || data?.new_csrf_token || csrf;
      loginSuccess(u, r, rotated);
      setTimeout(() => navigate('/admin', { replace: true }), 0);
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  };

  // Si ya autenticado y estamos en /login (p.ej. recarga) redirigir directo evitando flicker
  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Acceso Admin</h2>
        {error ? <div className="login-error">{error}</div> : null}
        <form onSubmit={onSubmit} className="login-form" noValidate>
          <div className="login-field">
            <label>Usuario</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              type="text"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="login-field">
            <label>Contraseña</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              autoComplete="current-password"
            />
          </div>
          <div className="login-actions">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
            <button onClick={() => navigate('/')} type="button" className="btn btn-secondary">
              Ir al inicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
