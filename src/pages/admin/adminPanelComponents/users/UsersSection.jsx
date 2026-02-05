import React from 'react';
import { useUsersData } from './hooks/useUsersData';
import UsersTable from './components/UsersTable';
import UserCreateForm from './components/UserCreateForm';
import UserRoleChangeForm from './components/UserRoleChangeForm';
import ForcePasswordForm from './components/ForcePasswordForm';
import SelfPasswordForm from './components/SelfPasswordForm';
import './usersSection.css';

/* =============================================================
   Componente: UsersSection (Refactorizado)
   Resumen: Sección de gestión de usuarios con arquitectura modular usando componentes especializados para cada formulario.
   Diccionario:
     - useUsersData: Hook que gestiona carga y estado de usuarios.
     - modular forms: Cada formulario es un componente independiente y reutilizable.
     - users-forms-grid: Layout CSS grid para organizar formularios.
     - cargar: Función de recarga compartida entre componentes que modifican usuarios.
   Funciones:
     - UsersSection({ adminService, mostrarMensaje }): Coordina hook de datos y renderiza componentes modulares.
   ============================================================= */
// Nombre de la función: UsersSection
// Parámetros: { adminService, mostrarMensaje }
// Proceso y salida: 
// 1. Utiliza hook para gestión de datos de usuarios.
// 2. Renderiza tabla y formularios como componentes independientes.
// 3. Proporciona callback de recarga para operaciones que requieren refresh.
// Refactorización: Separación total de responsabilidades en componentes especializados.

const UsersSection = ({ adminService, mostrarMensaje }) => {
  // Hook para gestionar datos de usuarios
  const { users, loading, cargar } = useUsersData({ adminService, mostrarMensaje });

  return (
    <div className="users-section">
      <h2>Gestión de Usuarios</h2>
      
      <UsersTable users={users} loading={loading} />

      <div className="users-forms-grid">
        <UserCreateForm 
          adminService={adminService} 
          mostrarMensaje={mostrarMensaje} 
          onUserCreated={cargar} 
        />

        <UserRoleChangeForm 
          adminService={adminService} 
          mostrarMensaje={mostrarMensaje} 
          onRoleChanged={cargar} 
        />

        <ForcePasswordForm 
          adminService={adminService} 
          mostrarMensaje={mostrarMensaje} 
        />

        <SelfPasswordForm 
          adminService={adminService} 
          mostrarMensaje={mostrarMensaje} 
        />
      </div>
    </div>
  );
};

export default UsersSection;
