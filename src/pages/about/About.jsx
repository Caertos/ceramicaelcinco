import { useEffect } from "react";
import Banner from "../../components/banner/Banner";
import PageContainer from "../../components/pageContainer/PageContainer";
import { useDocumentMeta, pageMetaConfig } from "../../hooks/useDocumentMeta";
import "./about.css";

/* =============================================================
   Componente: About
   Resumen: Página corporativa (Misión, Visión y Valores) con animaciones progresivas basadas en IntersectionObserver.
   Diccionario:
     - reveal-base: Estado inicial oculto/atenuado de un elemento animable.
     - reveal-in: Estado final visible tras intersección.
     - reveal-instant: Variante sin animación para usuarios con reduced motion.
   Funciones:
     - useEffect(init observer): Inicializa observer, aplica clases y limpia en desmontaje.
   ============================================================= */
// Nombre de la función: About
// Parámetros: (ninguno)
// Proceso y salida: Muestra banner + grid con tres bloques (Misión, Visión, Valores) aplicando animación diferida accesible.
function About() {
  // SEO: Configurar meta tags para la página "Quiénes Somos"
  useDocumentMeta(pageMetaConfig.about);

  useEffect(() => {
    const elements = document.querySelectorAll(
      ".about-grid > div, .about-grid article, .about-grid img"
    );
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      elements.forEach((el) => el.classList.add("reveal-instant"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
    );
    elements.forEach((el) => {
      el.classList.add("reveal-base");
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Banner
        bannerImg="/QuienesSomosBanner.webp"
        bannerAlt={"Banner Quienes Somos Ceramica el Cinco"}
      />
      <PageContainer>
        <h2 className="section-title">¿Quienes Somos?</h2>
        <section className="about-grid grid-2" aria-describedby="about-mision">
          <div className="Mision">
            <article>
              <h2 className="about-item__title">Misión</h2>
              <p className="about-item__body">
                Ofrecemos productos cerámicos de alta calidad para la
                construcción, con un firme compromiso con la innovación, la
                seguridad, la satisfacción de nuestros clientes y el cuidado del
                medio ambiente.
              </p>
            </article>
            <img
              className="ar-4-3"
              src="/Mision.webp"
              alt="Misión Cerámica el Cinco"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="Vision">
            <img
              className="ar-4-3"
              src="/Vision.webp"
              alt="Visión Cerámica el Cinco"
              loading="lazy"
              decoding="async"
            />
            <article>
              <h2 className="about-item__title">Visión</h2>
              <p className="about-item__body">
                Impulsar nuestro crecimiento con innovación y eficiencia, para
                consolidarnos como una empresa competitiva y líder en el mercado
                de productos cerámicos.
              </p>
            </article>
          </div>
          <div className="NuestrosValores">
            <article>
              <h2 className="about-item__title">Principios</h2>
              <p className="about-item__body">
                <br />
                <strong>Calidad:</strong> Fabricamos productos cerámicos con altos estándares,
                cumpliendo las expectativas del cliente.
                <br />
                <strong>Innovación:</strong> Buscamos
                constantemente nuevas soluciones y tecnologías para crear
                productos con valor agregado.
                <br />
                <strong>Sostenibilidad:</strong> Operamos con
                responsabilidad ambiental, optimizando recursos y reduciendo
                impactos.
                <br />
                <strong>Seguridad:</strong> Promovemos ambientes de trabajo seguros y
                saludables para todos.
                <br />
                <strong>Compromiso social:</strong> Contribuimos al
                desarrollo de nuestras comunidades y al bienestar de nuestros
                empleados.
                <br />
                <strong>Integridad:</strong> Actuamos con ética, transparencia y
                respeto en cada decisión y acción.
              </p>
            </article>
            <img
              className="ar-4-3"
              src="/Valores.webp"
              alt="Nuestros Valores Cerámica el Cinco"
              loading="lazy"
              decoding="async"
            />
          </div>
        </section>
      </PageContainer>
    </>
  );
}

export default About;
