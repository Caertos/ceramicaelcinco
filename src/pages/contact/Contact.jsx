import Banner from "../../components/banner/Banner";
import PageContainer from "../../components/pageContainer/PageContainer";
import ContactDirectory from "../../components/contactDirectory/ContactDirectory";
import { useEffect, useState } from "react";
import { contactService } from "../../services/contactService";
import { useDocumentMeta, pageMetaConfig } from "../../hooks/useDocumentMeta";
// reCAPTCHA visible retirado

import "./contact.css";

/* =============================================================
   Componente: Contact
   Resumen: Formulario de contacto con anti-spam (honeypot) y obtención de token CSRF antes de enviar.
   Diccionario:
     - honeypot: Campo oculto usado para detectar bots automatizados.
     - csrf: Token antifalsificación obtenido previo al POST.
   Funciones:
     - onChange(e): Actualiza estado de formulario controlado.
     - onSubmit(e): Valida y envía datos usando contactService; gestiona estados de loading y feedback.
   ============================================================= */
// Nombre de la función: Contact
// Parámetros: (ninguno)
// Proceso y salida: Carga token CSRF, renderiza formulario y directorio; al enviar valida campos y muestra resultado.
function Contact() {
  // SEO: Configurar meta tags para la página de Contacto
  useDocumentMeta(pageMetaConfig.contact);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    mensaje: "",
    hp: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    success: null,
    error: null,
  });
  const [csrfReady, setCsrfReady] = useState(false);
  // const [recaptchaToken, setRecaptchaToken] = useState(null); // reCAPTCHA opcional

  useEffect(() => {
    let mounted = true;
    contactService.getContactCsrf().then(() => {
      if (mounted) setCsrfReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status.loading) return;
    setStatus({ loading: true, success: null, error: null });
    try {
      if (!form.nombre || !form.apellido || !form.email || !form.mensaje) {
        throw new Error("Todos los campos son obligatorios");
      }
      const { message } = await contactService.sendContactMessage({ ...form });
      setStatus({
        loading: false,
        success: message || "Mensaje enviado",
        error: null,
      });
      setForm({ nombre: "", apellido: "", email: "", mensaje: "", hp: "" });
    } catch (err) {
      setStatus({
        loading: false,
        success: null,
        error: err.message || "Error al enviar",
      });
    }
  };

  return (
    <>
      <Banner
        bannerImg="/contactBanner.webp"
        bannerAlt={"Banner Contacto Ceramica el Cinco"}
      />
      <PageContainer>
        <h2 className="section-title">Contáctanos</h2>
        <div className="contact-container">
          <div className="lado-1">
            <form onSubmit={onSubmit} noValidate>
              <label htmlFor="nombre">Nombre</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                placeholder="Nombre"
                value={form.nombre}
                onChange={onChange}
                required
              />
              <label htmlFor="apellido">Apellido</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                placeholder="Apellido"
                value={form.apellido}
                onChange={onChange}
                required
              />
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={onChange}
                required
              />
              <label htmlFor="mensaje">Mensaje</label>
              <textarea
                id="mensaje"
                name="mensaje"
                placeholder="Mensaje"
                value={form.mensaje}
                onChange={onChange}
                required
                rows={5}
              />
              {/* Honeypot */}
              <div
                style={{
                  position: "absolute",
                  left: "-5000px",
                  top: "auto",
                  width: "1px",
                  height: "1px",
                  overflow: "hidden",
                }}
                aria-hidden="true"
              >
                <label htmlFor="hp">No llenar</label>
                <input
                  id="hp"
                  name="hp"
                  value={form.hp}
                  onChange={onChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <button type="submit" disabled={status.loading || !csrfReady}>
                {status.loading ? "Enviando..." : "Enviar"}
              </button>
              {status.error && (
                <p className="form-error" role="alert">
                  {status.error}
                </p>
              )}
              {status.success && (
                <p className="form-success" role="status">
                  {status.success}
                </p>
              )}
            </form>
          </div>
          <div className="lado-2">
            <img src="/contactImg.webp" alt="Imagen de contacto" />
          </div>
          <div className="directorio-grid">
            <ContactDirectory />
          </div>
        </div>
      </PageContainer>
    </>
  );
}

export default Contact;
