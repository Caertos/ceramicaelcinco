import { memo, useMemo, useEffect, useRef } from "react";
import Loader from "../../common/Loader";
import { useDeferredLoader } from "../../../hooks/useDeferredLoader";

/*
Resumen:
Visor iframe de PDF con loader diferido y sandbox opcional para orígenes externos.

Diccionario:
- sandbox: Atributo que limita capacidades de contenido embebido.

Parámetros:
- src (string)
- loading (bool, deprecado)
- onLoad (fn)

Proceso y salida:
1. Cambia src => inicia loader diferido.
2. onLoad del iframe detiene loader y propaga callback.
3. Determina same-origin; si distinto aplica sandbox seguro.
4. Retorna contenedor con <iframe> o mensaje de ausencia.

Notas:
- El prop loading externo se mantiene por compatibilidad.
- Podría integrarse IntersectionObserver para lazy-load.
*/
// Props: { src (string), loading (bool)|deprecated, onLoad (fn) }
function PdfViewer({ src, loading: externalLoading, onLoad }) {
  // Hook para loader del iframe (delay corto)
  const { showLoader, start, stop } = useDeferredLoader();
  const prevSrc = useRef(null);

  useEffect(() => {
    // Si cambia src iniciamos loader
    if (src && src !== prevSrc.current) {
      start();
      prevSrc.current = src;
    }
  }, [src, start]);

  // Compat: si se recibe externalLoading true inicia, false intenta detener
  useEffect(() => {
    if (typeof externalLoading === 'boolean') {
      if (externalLoading) start(); else stop();
    }
  }, [externalLoading, start, stop]);
  const iframeProps = useMemo(() => {
    if (!src) return {};
    let isSameOrigin = true;
    try {
      const url = new URL(src, window.location.origin);
      isSameOrigin = url.origin === window.location.origin;
    } catch {
      isSameOrigin = true;
    }
    const base = {
      title: "Visor de PDF de producto",
      src: `${src}#navpanes=0`,
      onLoad,
      referrerPolicy: "no-referrer",
    };
    return isSameOrigin ? base : { ...base, sandbox: "allow-same-origin allow-scripts allow-downloads" };
  }, [src, onLoad]);
  return (
    <div className="pdf-viewer-container" aria-busy={showLoader}>
      {showLoader && <div role="status" aria-live="polite"><Loader /></div>}
      {src ? (
        <iframe {...iframeProps} onLoad={(e) => { stop(); onLoad && onLoad(e); }} />
      ) : (
        <p role="status" aria-live="polite">No se encontró un PDF seleccionado.</p>
      )}
    </div>
  );
}

export default memo(PdfViewer);
