import { http } from './http';
import { getOrLoad, invalidate } from '../utils/dataCache';

/* =============================================================
  Módulo: galleryService
  Resumen: Recupera y cachea (TTL) elementos de galería por tipo (foto|video).
        Permite invalidar por tipo para forzar recarga.
  Diccionario:
    - TTL: Tiempo de vida en ms de la entrada cacheada.
    - tipo: Segmento de filtro (foto|video) usado en la key y query.
  ============================================================= */
// Nombre de la función: getGallery
// Parámetros:
//   - tipo (string): 'foto' o 'video'.
//   - opciones { force?, ttl? }
// Proceso y salida: Cachea por clave derivada gallery_{tipo}; GET endpoint; retorna array.
export async function getGallery(tipo = 'foto', { force = false, ttl = 60000 } = {}) {
  const key = `gallery_${tipo}`;
  return getOrLoad(key, async () => {
    const resp = await http.get(`/endpoints/get_gallery.php?tipo=${encodeURIComponent(tipo)}`);
    if (Array.isArray(resp)) return resp;
    if (!resp?.success) throw new Error(resp?.message || 'Error al obtener galería');
    return Array.isArray(resp.data) ? resp.data : [];
  }, { ttl, force });
}

// Nombre de la función: invalidateGallery
// Parámetros: tipo (string)
// Proceso y salida: Invalida caché de la clave específica para próxima recarga.
export function invalidateGallery(tipo) { invalidate(`gallery_${tipo}`); }
