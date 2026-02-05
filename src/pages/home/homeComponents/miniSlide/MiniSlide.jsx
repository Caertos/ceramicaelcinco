/*
Resumen:
Carrusel ligero (texto + imagen) con panel de título y navegación manual o automática.

Diccionario:
- slides: Lista de objetos { id, img, text }.
- autoplay: Avance automático tras intervalo.
- listbox/option: Roles ARIA para lista y opciones.
- aria-live polite: Anuncia cambios sin interrumpir.
- imgWidth: Custom property CSS para ancho de imagen.
- titleLines: Líneas del título divididas visualmente.

Parámetros:
- slides (Array)
- autoPlay (bool)
- interval (number ms)
- titleLines (string[])
- color (string)
- cardWidth (string)
- imgWidth (string)

Proceso y salida:
1. Mantiene índice actual.
2. Autoplay con timeout reiniciado al cambiar slide.
3. Soporta navegación teclado (ArrowLeft/ArrowRight) y botones.
4. Renderiza estructura accesible (role listbox / option) y placeholder si vacío.

Notas:
- Podría pausar autoplay al foco/hover.
- Mejorar anuncio del slide con aria-live custom.
*/

import { useState, useEffect, useCallback, useRef, useId } from "react";
import PropTypes from "prop-types";
import "./miniSlide.css";

/* Placeholder: estructura base cuando no se proveen slides reales */
const placeholderSlides = [];

// Nombre: MiniSlide (Componente principal)
function MiniSlide({
  slides = placeholderSlides,
/*   autoPlay = true,
  interval = 6000, */
  titleLines = ["LA BASE DE TUS", "PROYECTOS"],
  color = "var(--primary-color, #9d372d)",
  cardWidth = "54%",
  imgWidth = "240px",
}) {
  const hasSlides = slides && slides.length > 0;
  const [index, setIndex] = useState(0);
/*   const timer = useRef(null); */
  const cardRef = useRef(null);
  const listboxId = useId();
  const labelId = useId();

  const total = hasSlides ? slides.length : 0;

  /* ---------------------------------------------
     Función: go
     Parámetros:
       - i (Number): Índice destino (puede ser relativo o absoluto).
     Proceso: Normaliza el índice haciendo wrap modular sobre el total y actualiza estado.
     Salida: Actualiza estado 'index'. No retorna valor.
     --------------------------------------------- */
  const go = useCallback((i) => {
    if (!hasSlides) return;
    setIndex((i + total) % total);
  }, [hasSlides, total]);

  /* Función: next - Avanza al siguiente slide */
  const next = useCallback(() => go(index + 1), [go, index]);
  /* Función: prev - Retrocede al slide anterior */
  const prev = useCallback(() => go(index - 1), [go, index]);

  /* Efecto: autoplay
     Parámetros implicados: autoPlay, interval, total, index.
     Proceso: Programa un timeout para avanzar al siguiente slide si hay más de uno y autoplay está activo.
     Salida: Limpia el timeout en desmontaje o cambio de dependencias. */
/*   useEffect(() => {
    if (!autoPlay || total <= 1 || interval <= 0) return;
    timer.current = setTimeout(next, interval);
    return () => clearTimeout(timer.current);
  }, [index, autoPlay, interval, total, next]); */
  // Desactivado por interferencia con slide de logos clientes.

  /* Efecto: teclado
     Proceso: Añade listeners para flechas izquierda/derecha sobre la tarjeta enfocada.
     Salida: Limpia listener en desmontaje o cambios. */
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const handler = (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [next, prev]);

  return (
    <section
      className="mini-hero-slider"
      aria-roledescription="carrusel"
      aria-labelledby={labelId}
    >
      <div className="lhs-block" style={{ backgroundColor: color }}>
        <h2 id={labelId} className="lhs-title" aria-label={titleLines.join(" ")}>
          {titleLines.map((l, i) => (
            <span key={i} className={`title-line${i}`}>
              {l}
              <br />
            </span>
          ))}
        </h2>
      </div>
      <div
        className="slide-card"
        style={{ width: cardWidth }}
        tabIndex={0}
        ref={cardRef}
        role="group"
        aria-live="polite"
        aria-atomic="true"
      >
        <div
          id={listboxId}
          className="slides-wrapper"
          data-empty={!hasSlides}
          style={{ "--img-width": imgWidth }}
          role={hasSlides ? "listbox" : undefined}
          aria-label={hasSlides ? `Slide ${index + 1} de ${total}` : "Sin elementos"}
          aria-describedby={labelId}
        >
          {hasSlides ? (
            slides.map((s, i) => {
              const active = i === index;
              return (
                <article
                  key={s.id || i}
                  className={`slide-item ${active ? "active" : ""}`}
                  aria-hidden={!active}
                  role="option"
                  aria-selected={active}
                >
                  <div className="slide-img-box ar-4-3">
                    {s.img?.src ? (
                      <img
                        src={s.img.src}
                        alt={s.img.alt || "Imagen"}
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <div className="img-ph" aria-label="Imagen pendiente" />
                    )}
                  </div>
                  <div className="slide-text">
                    <p>{s.text || "“Añade el texto de tu mensaje aquí.”"}</p>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="slides-placeholder">
              <div className="fake-row" />
              <div className="fake-row short" />
              <div className="fake-row" />
            </div>
          )}
        </div>
        {hasSlides && total > 1 && (
          <div className="nav-btns">
            <button
              onClick={prev}
              aria-label="Anterior"
              className="nav-btn prev"
            />
            <button
              onClick={next}
              aria-label="Siguiente"
              className="nav-btn next"
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default MiniSlide;

MiniSlide.propTypes = {
  slides: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      img: PropTypes.shape({
        src: PropTypes.string,
        alt: PropTypes.string,
      }),
      text: PropTypes.string,
    })
  ),
  autoPlay: PropTypes.bool,
  interval: PropTypes.number,
  titleLines: PropTypes.arrayOf(PropTypes.string),
  color: PropTypes.string,
  cardWidth: PropTypes.string,
  imgWidth: PropTypes.string,
};
