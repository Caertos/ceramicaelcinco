import "./index.css";
import "./styles/tokens.css";
import "./styles/utilities.css";
import "./styles/buttons.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import Shell from './Shell';
import { AuthProvider } from './context/AuthContext.jsx';

/* =============================================================
  Resumen: Punto de entrada del frontend. Inyecta la aplicación en #root
        aplicando StrictMode y BrowserRouter. Renderiza <Shell /> que
        a su vez incluye <App /> y envoltura de layout.
  Diccionario:
    - StrictMode: Herramienta de desarrollo React para detectar efectos secundarios.
    - BrowserRouter: Router basado en History API navegando rutas limpias.
    - AuthProvider: Contexto que provee y gestiona el estado de autenticación de usuario.
  Proceso y salida: createRoot(...).render(...) monta todo el árbol React.
  ============================================================= */

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
