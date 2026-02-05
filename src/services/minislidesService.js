import { http } from './http';
import { getOrLoad, invalidate } from '../utils/dataCache';

/* =============================================================
  Módulo: minislidesService
  Resumen: Obtiene y cachea (TTL) mini slides públicos para la página de inicio.
  Diccionario:
    - slide: Registro bruto { id, text, image_url } del backend.
    - img: Objeto normalizado { src, alt } para uso directo en componente.
  ============================================================= */
export const minislidesService = {
  // Nombre de la función: getPublic
  // Parámetros: { force?, ttl? }
  // Proceso y salida: Cachea bajo clave 'public_minislides'; GET endpoint.
  //   Normaliza cada slide a { id,text,img? } resolviendo image_url a serve_media.
  async getPublic({ force = false, ttl = 120000 } = {}) {
    return getOrLoad('public_minislides', async () => {
      const res = await http.get('/endpoints/minislides.php?action=get_public');
      if (!res?.success) return [];
      return (res.data || []).map(s => {
        if (!s.image_url) return { id: s.id, img: null, text: s.text };
        const serveUrl = `/endpoints/serve_media.php?p=${encodeURIComponent(s.image_url)}`;
        return { id: s.id, img: { src: serveUrl, alt: 'Mini slide ' + s.id }, text: s.text };
      });
    }, { ttl, force });
  },
  // Nombre de la función: invalidatePublic
  // Parámetros: —
  // Proceso y salida: Invalida caché para próxima recarga.
  invalidatePublic() { invalidate('public_minislides'); }
};
