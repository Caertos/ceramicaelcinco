import Banner from '../../components/banner/Banner';
import PageContainer from '../../components/pageContainer/PageContainer';

import './contact.css';

function Contact() {
  return (
    <>
      <Banner bannerImg="/contactBanner.webp" />
      <PageContainer>
        <h2 className="section-title section-title-contact">Contáctanos</h2>
        <div className="contact-container">
          <div className='lado-1'>
            <form action="POST">
              <label htmlFor="nombre">Nombre</label>
              <input type="text" id="nombre" placeholder="Nombre" />
              <label htmlFor="apellido">Apellido</label>
              <input type="text" id="apellido" placeholder="Apellido" />
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="Email" />
              <label htmlFor="mensaje">Mensaje</label>
              <textarea id="mensaje" placeholder="Mensaje"></textarea>
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
