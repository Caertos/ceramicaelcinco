import { useLocation } from 'react-router-dom';
import App from './App';
import Navbar from './components/navbar/Navbar';
import Footer from './components/footer/Footer';
import FloatingWhatsappButton from './components/whatsapp/FloatingWhatsappButton';

/* =============================================================
   Resumen: Contenedor de alto nivel que decide si renderizar la
            cromo UI (Navbar, Footer, botón WhatsApp) alrededor de la
            aplicación principal según la ruta actual.
   Diccionario:
     - hideChrome: Bandera que oculta elementos decorativos/layout (login limpio).
   Proceso y salida: Usa useLocation para detectar la ruta; si pathname === '/login'
     oculta Navbar/Footer/FloatingWhatsappButton. Siempre renderiza <App />.
   ============================================================= */
export default function Shell() {
  const location = useLocation();
  const hideChrome = location.pathname === '/login';
  return (
    <>
      {!hideChrome && <Navbar />}
      <App />
      {!hideChrome && <Footer />}
      {/* Botón flotante WhatsApp (oculto en login para mantener la vista limpia) */}
      {!hideChrome && <FloatingWhatsappButton />}
    </>
  );
}
