import React, { useState } from 'react';

/* =============================================================
   Componente: UserRoleChangeForm
   Resumen: Formulario para cambiar el rol de usuarios existentes por ID.
   Diccionario:
     - roleChange: Estado del formulario { userId, role }.
     - adminService: Servicio para operaciones administrativas.
     - onRoleChanged: Callback ejecutado tras cambio exitoso.
     - Number(userId): Conversión a entero para API.
   Funciones:
     - cambiarRole(e): Handler de submit con validación y reset.
     - handleChange(field, value): Actualiza campo específico del estado.
   ============================================================= */
// Nombre de la función: UserRoleChangeForm
// Parámetros: { adminService, mostrarMensaje, onRoleChanged }
// Proceso y salida: Renderiza form para cambio de rol, valida ID, ejecuta cambio y resetea tras éxito.
const UserRoleChangeForm = ({ adminService, mostrarMensaje, onRoleChanged }) => {
  const [roleChange, setRoleChange] = useState({ 
    userId: '', 
    role: 'user' 
  });

  const cambiarRole = async (e) => {
    e.preventDefault();
    if (!roleChange.userId) return;
    
    try {
      await adminService.cambiarRole(Number(roleChange.userId), roleChange.role);
      mostrarMensaje('Role actualizado');
      setRoleChange({ userId: '', role: 'user' });
      onRoleChanged();
    } catch (e) { 
      mostrarMensaje(e.message, 'error'); 
    }
  };

  const handleChange = (field, value) => {
    setRoleChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={cambiarRole} className="card-form">
      <h3>Cambiar Rol</h3>
      <label>ID Usuario
        <input 
          value={roleChange.userId} 
          onChange={e => handleChange('userId', e.target.value)} 
          required 
        />
      </label>
      <label>Nuevo Rol
        <select 
          value={roleChange.role} 
          onChange={e => handleChange('role', e.target.value)}
        >
          <option value="user">Usuario</option>
          <option value="super">Super</option>
        </select>
      </label>
      <button className="btn btn-secondary" type="submit">Actualizar</button>
    </form>
  );
};

export default UserRoleChangeForm;