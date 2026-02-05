import { http } from './http';
import { getOrLoad, invalidate } from '../utils/dataCache';
/* =============================================================
     Módulo: catalogService
     Resumen: Obtiene y cachea (TTL) el catálogo público (categorías + productos).
                        Permite invalidar la caché para forzar recarga.
     Diccionario:
         - TTL: Tiempo de vida en ms del resultado cacheado.
         - AbortSignal: Señal externa opcional para cancelar fetch.
     ============================================================= */
// Nombre de la función: getCatalogs
// Parámetros: options { signal?, force?, ttl? }.
// Proceso y salida: Usa caché (clave public_catalogs); si expirada/force hace GET.
//   Lanza Error si respuesta no success. Devuelve array de categorías.
export async function getCatalogs(options = {}) {
    const { force = false, ttl = 180000 } = options;
    return getOrLoad('public_catalogs', async () => {
        const resp = await http.get('/endpoints/get_catalogos.php', options);
        if (!resp?.success) throw new Error(resp?.message || 'Error al obtener catálogos');
        return resp.data || [];
    }, { ttl, force });
}

// Nombre de la función: invalidateCatalogs
// Parámetros: —
// Proceso y salida: Elimina entrada de caché para provocar recarga en próxima invocación.
export function invalidateCatalogs() { invalidate('public_catalogs'); }