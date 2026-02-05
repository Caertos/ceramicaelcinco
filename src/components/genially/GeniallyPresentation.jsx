import { useEffect, useRef, useState } from 'react';
import './geniallyPresentation.css';

/* =============================================================
   Componente: GeniallyPresentation
   Resumen: Renderiza una presentación interactiva de Genially mediante un iframe.
   Props:
     - title (string): Título de la presentación para accesibilidad.
   Funciones:
     - GeniallyPresentation({title}): Componente que carga el contenido de Genially.
   ============================================================= */

function GeniallyPresentation({ title = "Proceso de Producción" }) {
  const iframeRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Asegurar que el iframe cargue correctamente
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setIsLoaded(true);
        iframe.style.opacity = '1';
      };

      iframe.addEventListener('load', handleLoad);
      
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  return (
    <div className="genially-container">
      <div className="genially-wrapper">
        {!isLoaded && (
          <div className="genially-loader">
            <div className="loader-spinner"></div>
            <p>Cargando presentación...</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src="/genially/genially.html"
          title={title}
          className="genially-iframe"
          frameBorder="0"
          allowFullScreen
          loading="lazy"
          allow="autoplay; fullscreen"
        />
      </div>
    </div>
  );
}

export default GeniallyPresentation;
