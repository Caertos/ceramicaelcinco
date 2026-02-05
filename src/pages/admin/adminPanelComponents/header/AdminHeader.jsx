import React from 'react';

/* =============================================================
   Componente: AdminHeader
   Resumen: Header del panel de administración con título y botón de logout.
   Diccionario:
     - logout: Acción de cerrar sesión y limpiar autenticación.
     - admin-header: Clase CSS para estilos del header del panel.
   Funciones:
     - AdminHeader({ onLogout }): Renderiza header con título y control de sesión.
   ============================================================= */
// Nombre de la función: AdminHeader
// Parámetros: { onLogout: Function }
// Proceso y salida: Renderiza header consistente con título "Panel de Administración" y botón de logout.
const AdminHeader = ({ onLogout }) => {
  return (
    <header className="admin-header">
      <h1>Panel de Administración</h1>
      <button
        className="btn btn-secondary logout-btn"
        type="button"
        onClick={onLogout}
      >
        Cerrar Sesión
      </button>
    </header>
  );
};

export default AdminHeader;