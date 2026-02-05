import { Link } from "react-router-dom";
import "./footer.css";

/*
Resumen:
Pie de página global con logo, enlaces de navegación básicos, datos de contacto y placeholders de redes sociales.

Diccionario:
- social-media: Contenedor para íconos de plataformas.
- placeholder: Elemento temporal pendiente de URL definitiva.

Parámetros:
No recibe props; contenido estático hardcode.

Proceso y salida:
Renderiza <footer> con cuatro columnas: logo, navegación interna, datos de contacto y redes sociales. Devuelve estructura semántica con listas.

Notas:
- Extraer datos a configuración para mantenimiento.
- Añadir i18n para futura traducción.
- Evaluar uso de <address> para datos de contacto.
*/
const Footer = () => {
  return (
    <footer className="footer">
      <div>
        <img
          src="/logoWhite.svg"
          alt="ElCincoLogo"
          className="footer-logo"
        />
      </div>
      <div>
        <h3>Conoce más</h3>
        <ul>
          <li>
            <Link to="/about">Quienes Somos</Link>
          </li>
          <li>
            <Link to="/products">Servicios</Link>
          </li>
        </ul>
      </div>
      <div>
        <h3>Contáctanos</h3>
        <ul>
          <li>
            Whatsapp: <a href="https://wa.me/573215630105" target="_blank" rel="noopener noreferrer">321 563 0105</a>
          </li>
          <li>
            Teléfono: <a href="tel:3126501785">312 650 1785</a>
          </li>
          <li>
            Correo: <a href="mailto:ventas@ceramicaselcinco.com">ventas@ceramicaselcinco.com</a>
          </li>
          <li>Preguntas frecuentes</li>
          <li>
            <a
              href="https://www.google.com/maps/place/CERAMICAS+EL+CINCO/@9.250168,-75.4033305,17z/data=!4m14!1m7!3m6!1s0x8e5914c8ca61075d:0x546f586fb9dc79df!2sCERAMICAS+EL+CINCO!8m2!3d9.250168!4d-75.4033305!16s%2Fg%2F11dzdcb673!3m5!1s0x8e5914c8ca61075d:0x546f586fb9dc79df!8m2!3d9.250168!4d-75.4033305!16s%2Fg%2F11dzdcb673?entry=ttu&g_ep=EgoyMDI1MDkyOS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
            >
              Localízanos
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h3>Síguenos</h3>
        <div className="social-media">
          <a 
            href="https://www.instagram.com/ceramicaselcinco_oficial?igsh=MWRkejRiNzA4dm96Nw=="
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/instagram.png" alt="Instagram" />
          </a>
          <a 
            href="https://www.facebook.com/share/1BpHZafgty/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/facebook.png" alt="Facebook" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
