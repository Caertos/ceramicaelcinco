import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./navbar.css";

/*
Resumen:
Barra de navegación responsive con menú hamburguesa, bloqueo de scroll al abrir panel, control de foco (focus trap) y cierre por Escape o clic exterior.

Diccionario:
- focus trap: Ciclo de foco dentro del menú abierto al usar Tab/Shift+Tab.
- no-scroll: Clase en <body> que deshabilita scroll cuando el panel lateral está activo.
- firstLinkRef: Referencia al primer foco interno (botón cerrar) al abrir el menú.

Parámetros:
(No recibe props) Estado interno: isMenuOpen (boolean) controla apertura del panel.

Proceso y salida:
1. Clic en botón hamburguesa alterna isMenuOpen.
2. Al abrir: añade clase no-scroll y enfoca botón interno.
3. Mientras abierto: keydown gestiona Tab cíclico y Escape para cerrar.
4. Clic fuera u overlay cierran y restauran foco al disparador.
5. Renderiza <header> con logo, botón y navegación (lista de enlaces NavLink).

Notas:
- Roles menubar/menuitem son redundantes; se pueden simplificar a semántica nativa.
- Potencial añadir animaciones con prefers-reduced-motion.
- No se memoiza; costo render bajo.
*/
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const firstLinkRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Cerrar con Escape y gestionar foco cíclico dentro del menú cuando está abierto
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === "Tab") {
        // Focus trap simple
        const focusable = menuRef.current?.querySelectorAll('a[href], button:not([disabled])');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Mover el foco al primer enlace cuando se abre el menú
  useEffect(() => {
    if (isMenuOpen) {
      // Bloquear scroll del body
      document.body.classList.add('no-scroll');
      // Delay pequeño para asegurar render
      requestAnimationFrame(() => {
        firstLinkRef.current?.focus();
      });
    } else {
      document.body.classList.remove('no-scroll');
    }
  }, [isMenuOpen]);

  const navItems = [
    { name: "Inicio", path: "/" },
    { name: "¿Quienes Somos?", path: "/about" },
    { name: "Producto", path: "/products" },
    { name: "¿Cómo lo hacemos?", path: "/process" },
    { name: "Galería", path: "/gallery" },
    { name: "Contáctanos", path: "/contact" },
  ];

  return (
    <header className="navbar-container">
      <a href="/" className="logo-link" aria-label="Ir al inicio">
        <img className="logo" src="/LogoCEC_2025-2.webp" alt="Logo Cerámica el Cinco" />
      </a>
      <button
        ref={buttonRef}
        className={`menu-toggle ${isMenuOpen ? "open" : ""}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Abrir menú de navegación"
        aria-expanded={isMenuOpen}
        aria-controls="primary-navigation"
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
      {isMenuOpen && <div className="nav-overlay" onClick={() => setIsMenuOpen(false)} aria-hidden="true"></div>}
      <nav
        ref={menuRef}
        id="primary-navigation"
        className={`nav-menu ${isMenuOpen ? "open" : ""}`}
        role="navigation"
        aria-label="Navegación principal"
      >
        {/** Botón de cierre adicional dentro del panel móvil */}
        <button
          type="button"
          className="close-menu-button"
          aria-label="Cerrar menú"
          onClick={() => {
            setIsMenuOpen(false);
            buttonRef.current?.focus();
          }}
          ref={firstLinkRef}
          tabIndex={isMenuOpen ? 0 : -1}
        >
          <span aria-hidden="true">&times;</span>
        </button>
        <ul className="nav-list" role="menubar">
          {navItems.map((item, idx) => {
            const isContact = idx === navItems.length - 1;
            return (
              <li
                key={item.name}
                className={`${isContact ? "contact-button" : "nav-button"}`}
                role="none"
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setIsMenuOpen(false)}
                  role="menuitem"
                  tabIndex={isMenuOpen ? 0 : -1}
                >
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
