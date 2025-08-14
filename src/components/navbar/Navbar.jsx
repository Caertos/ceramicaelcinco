import { Link, useLocation } from "react-router-dom";
import "./navbar.css";

function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: "Inicio", path: "/" },
    { name: "¿Quienes Somos?", path: "/about" },
    { name: "Producto", path: "/products" },
    { name: "¿Cómo lo hacemos?", path: "/process" },
    { name: "Galería", path: "/gallery" },
    { name: "Contáctanos", path: "/contact" },
  ];

  const activeIndex = navItems.findIndex(
    (item) => item.path === location.pathname
  );

  return (
    <div className="navbar-container">
      <img className="logo" src="/LogoCEC.svg" alt="" />
      <nav>
        <ul className="nav-list">
          {navItems.map((item, idx) => {
            const isContact = idx === navItems.length - 1;
            return (
              <li
                key={item.name}
                className={`${isContact ? "contact-button" : "nav-button"} ${
                  activeIndex === idx ? "active" : ""
                }`}
              >
                <Link to={item.path}>{item.name}</Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default Navbar;
