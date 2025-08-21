import { NavLink} from "react-router-dom";
import "./navbar.css";

function Navbar() {

  const navItems = [
    { name: "Inicio", path: "/" },
    { name: "¿Quienes Somos?", path: "/About" },
    { name: "Producto", path: "/Products" },
    { name: "¿Cómo lo hacemos?", path: "/Process" },
    { name: "Galería", path: "/Gallery" },
    { name: "Contáctanos", path: "/Contact" },
  ];

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
                className={`${isContact ? "contact-button" : "nav-button"}`}
              >
                <NavLink to={item.path} className={({ isActive }) => (isActive ? "active" : "")}>{item.name}</NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default Navbar;
