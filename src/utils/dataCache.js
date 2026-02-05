/* =============================================================
  Util: dataCache
  Resumen: Caché in-memory simple con TTL y deduplicación de peticiones concurrentes.
  Uso:
    import { getOrLoad, invalidate, update } from '../utils/dataCache';
    const data = await getOrLoad('catalogs', loaderFn, { ttl: 120000 });
  Estrategia:
    - Si existe una entrada vigente (no expirada) => retorna inmediatamente.
    - Si hay una promesa en vuelo para la misma key => espera esa promesa.
    - Caso contrario ejecuta loader(), almacena resultado y lo retorna.
  Notas:
    - Sólo en-memory: se reinicia al refrescar la página (adecuado para datos públicos de poca mutación crítica).
    - update() permite mutar datos localmente tras una operación sin refetch global.
============================================================= */
const store = new Map(); // key -> { data, ts, ttl, promise? }

function isFresh(entry) {
  if (!entry) return false;
  if (typeof entry.ttl !== 'number') return true; // ttl infinito si no definido
  return (Date.now() - entry.ts) < entry.ttl;
}

export async function getOrLoad(key, loader, { ttl = 60000, force = false } = {}) {
  let entry = store.get(key);
  if (!force && entry && isFresh(entry) && entry.data !== undefined) {
    return entry.data;
  }
  if (!force && entry && entry.promise) {
    return entry.promise; // dedupe concurrente
  }
  // Crear nueva entrada/promesa
  const p = (async () => {
    try {
      const data = await loader();
      store.set(key, { data, ts: Date.now(), ttl });
      return data;
    } finally {
      // eliminar referencia a promise para futuras llamadas
      const current = store.get(key);
      if (current && current.promise) {
        current.promise = null;
      }
    }
  })();
  store.set(key, { ...(entry || {}), promise: p, ttl, ts: entry?.ts || Date.now() });
  return p;
}

export function invalidate(key) {
  store.delete(key);
}

export function update(key, updater) {
  const entry = store.get(key);
  if (!entry) return;
  const newData = typeof updater === 'function' ? updater(entry.data) : updater;
  store.set(key, { ...entry, data: newData, ts: Date.now() });
}

export function getCached(key) {
  const entry = store.get(key);
  if (entry && isFresh(entry)) return entry.data;
  return undefined;
}

export function hasFresh(key) {
  return isFresh(store.get(key));
}

export default { getOrLoad, invalidate, update, getCached, hasFresh };
