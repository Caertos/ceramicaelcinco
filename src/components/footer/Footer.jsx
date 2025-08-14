import "./footer.css";

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
          <li>Quienes Somos</li>
          <li>Servicios</li>
          {/*           <li>
            {" "}
            <a href="https://www.pixabit.com.co" className="pixabit" rel="nofollow">
              Desarrollado por Pixabit ®
            </a>
          </li> */}
        </ul>
      </div>
      <div>
        <h3>Contáctanos</h3>
        <ul>
          <li>
            Whatsapp: <span>3XX XXX XXXX</span>
          </li>
          <li>
            Teléfono: <span>605 XXX XXXX</span>
          </li>
          <li>
            Correo: <span>ventas@ceramicaelcinco.com</span>
          </li>
          <li>Preguntas frecuentes</li>
          <li>Localízanos</li>
        </ul>
      </div>
      <div>
        <h3>Síguenos</h3>
        <div className="social-media">
          <a href="">
            <img src="/instagram.png" alt="Instagram" />
          </a>
          <a href="">
            <img src="/facebook.png" alt="Facebook" />
          </a>
          <a href="">
            <img src="/tiktok.png" alt="TikTok" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
