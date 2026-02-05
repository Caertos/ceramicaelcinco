import "./howWeDoIt.css";

/*
Resumen:
Sección estática descriptiva del proceso (texto dividido en dos columnas).

Diccionario:
- how-we-do-it: Bloque informativo de etapas generales.

Parámetros:
(Sin props) Contenido embebido.

Proceso y salida:
Renderiza contenedor con título y dos columnas de párrafos.

Notas:
- Posible migración a página productionProcess con pasos detallados.
- Se puede mejorar semántica añadiendo <section>/<article> por bloque.
*/

const HowWeDoIt = () => {
  return (
    <div className="how-we-do-it-container">
      <h2 className="section-title">¿Cómo lo hacemos?</h2>
      <div className="how-we-do-it-content">
        <div>
          <p>
            Nuestros procesos de minería se llevan a cabo bajo exigentes normas
            de ingeniería y protección del medio ambiente. <span></span>
          </p>
          <p>
            Para los procesos de moldeado, secado y horneado, disponemos de
            equipos e instalaciones de las más altas especificaciones técnicas
            en la industria ladrillera.<span></span>
          </p>
          <p>
            Durante el proceso de elaboración de los ladrillos realizamos
            estrictos controles de calidad que nos permiten garantizar a
            nuestros clientes la idoneidad de nuestros productos.<span></span>
          </p>
        </div>
        <div>
          <p>
            <span></span>
            Poseemos arcillas que nos permiten garantizar productos de excelente
            calidad y cálidos colores terracota.
          </p>
          <p>
            <span></span>
            Diseñamos nuestras mezclas en laboratorio buscando siempre productos
            con gran resistencia mecánica y bajos índices de absorción de
            humedad.
          </p>
          <p>
            <span></span>
            Nuestros procesos de productos terminados se ejecutan bajo la óptica
            del cumplimiento y la oportunidad en las entregas.
          </p>
          <p>
            <span></span>
            Nos caracterizamos por ser eficaces y eficientes a la hora de
            entregar el producto solicitado por nuestros clientes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowWeDoIt;
