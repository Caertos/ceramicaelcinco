import Banner from '../../components/banner/Banner';
import PageContainer from '../../components/pageContainer/PageContainer';

import './contact.css';

function Contact() {
  return (
    <>
      <Banner bannerImg="/contactBanner.webp" bannerAlt={"Banner Contacto Ceramica el Cinco"} />
      <PageContainer>
        <h2 className="section-title section-title-contact">Contáctanos</h2>
        <div className="contact-container">
          <div className='lado-1'>
            <form method="POST">
              <label htmlFor="nombre">Nombre</label>
              <input type="text" id="nombre" name='nombre' placeholder="Nombre" />
              <label htmlFor="apellido">Apellido</label>
              <input type="text" id="apellido" name='apellido' placeholder="Apellido" />
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name='email' placeholder="Email" />
              <label htmlFor="mensaje">Mensaje</label>
              <textarea id="mensaje" name='mensaje' placeholder="Mensaje"></textarea>
              <button type="submit">Enviar</button>
            </form>
          </div>
          <div className='lado-2'></div>
        </div>
      </PageContainer>
    </>
  );
}

export default Contact;
