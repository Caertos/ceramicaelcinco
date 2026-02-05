/* =============================================================
   Módulo: http.js
   Resumen: Abstracción fetch centralizada con soporte para credenciales,
            cabecera CSRF automática, timeout, abort encadenado, parseo JSON
            tolerante a errores y reintento único si el backend solicita
            renovación de token CSRF.
   Diccionario:
     - CSRF: Token anti falsificación enviado en X-CSRF-Token si existe en sessionStorage.
     - timeoutMs: Límite en milisegundos tras el cual se aborta la petición.
     - AbortController: API para cancelar solicitudes en curso.
     - sessionStorage: API de almacenamiento de sesión del navegador.
      Se utiliza aquí para persistir y recuperar el token CSRF entre peticiones
      durante la vida de la pestaña/ventana.
   Funciones expuestas: http.request, http.get, http.post, http.postFormData, http.refreshCsrfToken
   ============================================================= */

// Nombre de la función: getCsrfToken
// Parámetros: —
// Proceso y salida: Recupera token CSRF almacenado en sessionStorage o devuelve ''.
function getCsrfToken() {
  try {
    return sessionStorage.getItem('csrf_token') || '';
  } catch {
    return '';
  }
}

// Nombre de la función: refreshCsrfToken
// Parámetros: —
// Proceso y salida: Llama a /endpoints/login.php (GET) para obtener nuevo csrf_token y lo persiste; retorna string o ''.
async function refreshCsrfToken() {
  try {
    const res = await fetch('/endpoints/login.php', { credentials: 'include' });
    const json = await res.json().catch(() => null);
    const t = json?.csrf_token || json?.data?.csrf_token;
    if (t) {
      try { sessionStorage.setItem('csrf_token', t); } catch { /* ignore */ }
      return t;
    }
  } catch { /* ignore */ }
  return '';
}

// Nombre de la función: buildHeaders
// Parámetros:
//   - custom (object): Cabeceras adicionales/override.
//   - hasBody (boolean): Indica presencia de payload.
//   - isJson (boolean): Controla si se asigna Content-Type application/json.
// Proceso y salida: Construye instancia Headers estándar agregando CSRF si disponible.
function buildHeaders(custom = {}, hasBody = false, isJson = true) {
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  const csrf = getCsrfToken();
  if (csrf) headers.set('X-CSRF-Token', csrf);
  // Content-Type solo si es JSON explícito
  if (hasBody && isJson) headers.set('Content-Type', 'application/json');
  // Merge custom (sobrescribe si es necesario)
  for (const [k, v] of Object.entries(custom || {})) {
    if (v == null) continue;
    headers.set(k, v);
  }
  return headers;
}

// Nombre de la función: parseJsonSafe
// Parámetros: response (Response)
// Proceso y salida: Intenta response.json(); retorna objeto o null si parse falla.
async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Nombre de la función: withTimeout
// Parámetros: controller (AbortController), ms (number)
// Proceso y salida: Programa abort() tras ms; ignora ms inválidos.
function withTimeout(controller, ms) {
  if (!ms || ms <= 0) return;
  setTimeout(() => {
    try {
      controller.abort();
    } catch {
      // noop
    }
  }, ms);
}

// Nombre de la función: request
// Parámetros:
//   - url (string)
//   - options: { method?, headers?, body?, credentials?, timeoutMs?, signal? }
// Proceso y salida: Ejecuta fetch con timeout/abort encadenado. Intenta parse JSON.
//   Si status !ok lanza Error enriquecido { status, data }. Reintenta una vez ante csrf_required.
async function request(url, { method = 'GET', headers = {}, body = null, credentials = 'include', timeoutMs = 15000, signal: externalSignal, _retried } = {}) {
  const controller = new AbortController();
  withTimeout(controller, timeoutMs);
  // Encadenar abort si nos pasan una señal externa
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isJson = !!(body && !isFormData);
  const opts = {
    method,
    credentials,
  signal: controller.signal,
    headers: buildHeaders(headers, !!body, isJson)
  };
  if (body) {
    opts.body = isJson ? JSON.stringify(body) : body;
  }

  const res = await fetch(url, opts);
  const json = await parseJsonSafe(res);
  if (!res.ok) {
    // Detección de caso CSRF ausente/expirado para reintentar una vez
    if (!_retried && json && (json.csrf_required || json.csrf_required === true)) {
      const before = getCsrfToken();
      await refreshCsrfToken();
      const after = getCsrfToken();
      if (after && after !== before) {
        return request(url, { method, headers, body, credentials, timeoutMs, signal: externalSignal, _retried: true });
      }
    }
    const msg = (json && (json.message || json.error)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
}

// Nombre de la función: get
// Parámetros: url (string), opts (object opcional)
// Proceso y salida: Wrapper de request con método GET.
function get(url, opts = {}) {
  return request(url, { ...opts, method: 'GET' });
}

// Nombre de la función: post
// Parámetros: url (string), body (object), opts (object)
// Proceso y salida: Envía POST serializando body como JSON.
function post(url, body, opts = {}) {
  return request(url, { ...opts, method: 'POST', body });
}

// Nombre de la función: postFormData
// Parámetros: url (string), formData (FormData), opts (object)
// Proceso y salida: Envía multipart sin establecer Content-Type manual (boundary automático).
function postFormData(url, formData, opts = {}) {
  return request(url, { ...opts, method: 'POST', body: formData });
}

export const http = { request, get, post, postFormData, refreshCsrfToken };
