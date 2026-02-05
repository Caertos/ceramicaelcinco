/* =============================================================
   Resumen: Utilidades para integrar reCAPTCHA (v3/v2 invisible) incluyendo
            carga diferida del script oficial, detección de site key y
            obtención de tokens para acciones específicas.
   Diccionario:
     - site key: Clave pública provista por Google reCAPTCHA.
     - token: Cadena firmada que el backend valida contra la API de Google.
   ============================================================= */

let loadPromise = null;

/**
Nombre de la función: getRecaptchaSiteKey
Parámetros: —
Proceso y salida: Busca la clave primero en variables Vite (import.meta.env)
  y luego en window.RECAPTCHA_SITE_KEY; retorna '' si no existe.
*/
export function getRecaptchaSiteKey() {
  // Vite env o variable global
  let envKey = '';
  try {
    // Puede lanzar según entorno de build; en Vite existe import.meta.env
    envKey = (import.meta && import.meta.env && import.meta.env.VITE_RECAPTCHA_SITE_KEY) ? import.meta.env.VITE_RECAPTCHA_SITE_KEY : '';
  } catch {
    envKey = '';
  }
  const winKey = typeof window !== 'undefined' ? (window.RECAPTCHA_SITE_KEY || '') : '';
  return envKey || winKey || '';
}

/**
Nombre de la función: loadRecaptcha
Parámetros: siteKey (string)
Proceso y salida: Inyecta script reCAPTCHA si no está cargado; retorna
  Promise que resuelve a window.grecaptcha listo.
*/
export function loadRecaptcha(siteKey) {
  if (!siteKey) return Promise.reject(new Error('Site key vacía'));
  if (loadPromise) return loadPromise;
  if (typeof window !== 'undefined' && window.grecaptcha) {
    loadPromise = Promise.resolve(window.grecaptcha);
    return loadPromise;
  }
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) resolve(window.grecaptcha);
      else reject(new Error('grecaptcha no cargó'));
    };
    script.onerror = () => reject(new Error('Error cargando reCAPTCHA'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

/**
Nombre de la función: getRecaptchaToken
Parámetros: action (string='login'), siteKey (string opcional)
Proceso y salida: Asegura carga de reCAPTCHA y ejecuta la acción para
  generar token; retorna '' si ocurre algún fallo.
*/
export async function getRecaptchaToken(action = 'login', siteKey) {
  const key = siteKey || getRecaptchaSiteKey();
  if (!key) return '';
  try {
    const grecaptcha = await loadRecaptcha(key);
    await new Promise((r) => grecaptcha.ready(r));
    const token = await grecaptcha.execute(key, { action });
    return token || '';
  } catch {
    return '';
  }
}
