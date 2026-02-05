/* =============================================================
   Módulo: contactService
   Resumen: Gestiona las interacciones del frontend con el endpoint de
            contacto (obtención de CSRF y envío de mensajes con reCAPTCHA).
   Diccionario:
     - CSRF: Token anti falsificación necesario para validar POST.
     - reCAPTCHA: Servicio de Google que emite un token para mitigar spam.
   Funciones expuestas:
     - getContactCsrf(force?): Recupera y cachea el token CSRF.
     - sendContactMessage(payload): Envía mensaje aplicando token y reCAPTCHA.
   ============================================================= */
import { http } from './http';
import { getRecaptchaSiteKey, getRecaptchaToken } from '../utils/recaptcha';

let cachedContactCsrf = null;

// Nombre de la función: getContactCsrf
// Parámetros:
//   - force (boolean): Si true fuerza nueva obtención ignorando caché.
// Proceso y salida: Solicita al backend token CSRF (GET) y lo cachea; retorna string.
export async function getContactCsrf(force = false) {
  if (!force && cachedContactCsrf) return cachedContactCsrf;
  const data = await http.get('/endpoints/contact.php');
  const token = data?.csrf_token || data?.data?.csrf_token || data?.csrfToken || null;
  if (token) cachedContactCsrf = token;
  return cachedContactCsrf;
}

// Nombre de la función: sendContactMessage
// Parámetros:
//   - objeto con { nombre, apellido, email, mensaje, hp? } (honeypot opcional)
// Proceso y salida: Asegura CSRF; obtiene token reCAPTCHA si disponible; envía POST.
//   Reintenta una vez si el servidor solicita renovar CSRF. Retorna { message }.
export async function sendContactMessage({ nombre, apellido, email, mensaje, hp = '', recaptcha_token: externalToken }) {
  if (!cachedContactCsrf) await getContactCsrf();
  let recaptcha_token = externalToken || '';
  // Si no viene token externo (visible), intentar v3 automática
  if (!recaptcha_token) {
    const siteKey = getRecaptchaSiteKey();
    if (siteKey) {
      try { recaptcha_token = await getRecaptchaToken('contact', siteKey); } catch { /* noop */ }
    }
  }
  const payload = { nombre, apellido, email, mensaje, csrf_token: cachedContactCsrf, recaptcha_token, hp };
  try {
    const res = await http.post('/endpoints/contact.php', payload);
    return { message: res?.message || 'Mensaje enviado' };
  } catch (err) {
    // Reintento si es un problema de CSRF
    const needsCsrf = err?.data?.csrf_required || /csrf/i.test(err?.message || '');
    if (needsCsrf) {
      await getContactCsrf(true);
      const retry = await http.post('/endpoints/contact.php', { ...payload, csrf_token: cachedContactCsrf });
      return { message: retry?.message || 'Mensaje enviado' };
    }
    throw err;
  }
}

export const contactService = { getContactCsrf, sendContactMessage };
