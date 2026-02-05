import { useState, useEffect, useCallback } from "react";
import { useDeferredLoader } from "../../../hooks/useDeferredLoader";
import { getGallery } from '../../../services/galleryService';

/* =============================================================
   Hook: useGalleryData
   Resumen: Hook para gestionar la carga de datos de galería con alternancia entre fotos y videos.
   Diccionario:
     - isActive: false = fotos, true = videos.
     - items: Array completo de elementos cargados desde API.
     - tipoActual: String que indica el tipo actual ('foto' o 'video').
     - fetchGallery: Función de carga con manejo de errores y estados.
     - useDeferredLoader: Hook para loader visual con retraso.
   Funciones:
     - fetchGallery(): Carga asíncrona con limpieza de estado y manejo de errores.
     - useEffect: Recarga automática cuando cambia el tipo de contenido.
   ============================================================= */
// Nombre de la función: useGalleryData
// Parámetros: (ninguno)
// Proceso y salida: Gestiona estado de tipo, carga de datos, loading y errores para galería de fotos/videos.
export const useGalleryData = () => {
  // false -> fotos, true -> videos
  const [isActive, setIsActive] = useState(false);
  const [items, setItems] = useState([]); // elementos cargados del backend
  const { showLoader, start: startLoader, stop: stopLoader } = useDeferredLoader();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tipoActual = isActive ? 'video' : 'foto';

  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);
      startLoader();
      setError('');
      setItems([]);
      const data = await getGallery(tipoActual, { ttl: 90000 });
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      stopLoader();
    }
  }, [tipoActual, startLoader, stopLoader]);

  useEffect(() => {
    let cancel;
    (async () => { cancel = await fetchGallery(); })();
    return () => { if (typeof cancel === 'function') cancel(); };
  }, [fetchGallery]);

  return {
    isActive,
    setIsActive,
    items,
    loading,
    error,
    showLoader,
    tipoActual
  };
};