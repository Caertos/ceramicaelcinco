import React from 'react';

/* =============================================================
   Componente: UsersTable
   Resumen: Tabla responsiva para mostrar lista de usuarios del sistema con información básica.
   Diccionario:
     - users: Array de objetos usuario { id, username, role, created_at }.
     - loading: Estado que indica si los datos están cargando.
     - users-table: Clase CSS para estilos de la tabla.
   Funciones:
     - UsersTable({ users, loading }): Renderiza tabla con headers y filas de usuarios.
   ============================================================= */
// Nombre de la función: UsersTable
// Parámetros: { users: Array, loading: boolean }
// Proceso y salida: Renderiza tabla HTML con loading state, headers fijos y mapeo de usuarios a filas.
const UsersTable = ({ users, loading }) => {
  if (loading) {
    return <p>Cargando...</p>;
  }

  return (
    <table className="users-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Creado</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id}>
            <td>{u.id}</td>
            <td>{u.username}</td>
            <td>{u.role}</td>
            <td>{u.created_at || ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UsersTable;