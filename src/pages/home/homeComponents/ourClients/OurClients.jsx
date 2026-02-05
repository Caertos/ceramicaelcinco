import "./ourClients.css";

/*
Resumen:
Listado animado (marquee loop) de logos de clientes duplicando el set para efecto continuo.

Diccionario:
- marquee: Desplazamiento horizontal infinito.

Parámetros:
(Sin props) Datos internos estáticos.

Proceso y salida:
1. Define lista base de logos.
2. Duplica array para loop sin salto.
3. Renderiza sección con pista animada.

Notas:
- Futuro: consumir desde backend / API.
- Accesibilidad: aria-label en contenedor describe propósito.
*/
const OurClients = () => {
  // Fuente de datos (cuando haya backend reemplazar por fetch)
  const clients = [
    { id: 1, name: "Constructora Vimar", logo: "/logoVimar.svg" },
    { id: 2, name: "AC España", logo: "/logoACEspana.svg" },
    { id: 3, name: "Urbecon", logo: "/logoUrbecon.svg" },
    { id: 4, name: "Vigoz", logo: "/logoVigoz.svg" },
  ];

  const loopGroups = [clients, clients];

  return (
    <section className="our-clients-container">
      <h2 className="section-title2">Nuestros Clientes</h2>
      <div
        className="clients-marquee"
        aria-label="Logos de clientes desplazándose de manera continua"
      >
        <div className="clients-track">
          {loopGroups.map((group, gi) => (
            <div
              className="clients-group"
              key={"group-" + gi}
              aria-hidden={gi === 1 ? true : undefined}
            >
              {group.map((client) => (
                <div
                  key={client.id + "-" + gi}
                  className="client-item"
                  title={client.name}
                >
                  <img src={client.logo}
                  className="logoImg"
                  alt={client.name}
                  loading="lazy"
                  width={360}
                  height={140}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurClients;
