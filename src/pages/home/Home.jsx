import MiniSlide from "./homeComponents/miniSlide/MiniSlide";
import { useEffect, useState } from "react";
import { minislidesService } from "../../services/minislidesService";
import OurClients from "./homeComponents/ourClients/OurClients";
import { Link } from "react-router-dom";
import Loader from "../../components/common/Loader";
import { useDeferredLoader } from "../../hooks/useDeferredLoader";
import { useDocumentMeta, pageMetaConfig } from "../../hooks/useDocumentMeta";
import "./home.css";

/* =============================================================
   Resumen: Página principal con video hero, CTAs (Contacto / Productos), 
            carrusel MiniSlide y clientes.
   Diccionario:
     - MiniSlide: Carrusel ligero de mensajes configurables.
     - CTA: Call To Action (botón destacado).
     - deferred loader: Loader que aparece tras un pequeño retardo.
   Proceso y salida: 
     1. Monta: inicia loader diferido y solicita minislides.
     2. Recibe datos: actualiza miniSlides y detiene loader.
     3. Render: video en loop + botones + carrusel + sección clientes + banner ambiental.
   Notas:
     - Falta manejo explícito de error (posible mejora: fallback textual).
     - Video podría usar poster (imagen de carga/fallback visual) y 
       prefer-reduced-motion (accesibilidad para usuarios con sensibilidad 
       al movimiento o preferencias del sistema).
   ============================================================= */
function Home() {
  const [miniSlides, setMiniSlides] = useState([]);
  const { showLoader, start, stop } = useDeferredLoader();

  // SEO: Configurar meta tags para la página de inicio
  useDocumentMeta(pageMetaConfig.home);

  useEffect(() => {
    let cancel = false;
    start();
    (async () => {
      const data = await minislidesService.getPublic();
      if (!cancel) setMiniSlides(data);
      if (!cancel) stop();
    })();
    return () => { cancel = true; stop(); };
  }, [start, stop]);

  return (
    <>
  {showLoader && <Loader message="Cargando inicio…" />}
      <div className="video-container">
        <video autoPlay loop muted preload="auto" className="video-banner">
          <source src="/Videoweb.webm" type="video/webm" />
        </video>
        <div className="cta-group">
          <h1 className="slogan">
            Cerámicas el Cinco <br /> <span>Ladrillos bien hechos</span>
          </h1>
          <div className="cta-buttons">
            <Link className="btn cta-btn cta-primary" to="/contact">
              Contacto
            </Link>
            <Link className="btn cta-btn cta-outline" to="/products">
              Productos
            </Link>
          </div>
        </div>
      </div>
      <MiniSlide slides={miniSlides} autoPlay={true} />
      <OurClients />
      <img
        src="/BannerAmbiental.webp"
        alt="Banner Ambiental Cerámicas el Cinco"
        style={{ marginBottom: "-10px" }}
      />
    </>
  );
}

export default Home;
