import React, { useState } from 'react';

/* =============================================================
   Componente: UserCreateForm
   Resumen: Formulario para crear nuevos usuarios del sistema con validación y reset automático.
   Diccionario:
     - nuevo: Estado del formulario { username, password, role }.
     - adminService: Servicio para operaciones de usuario.
     - onUserCreated: Callback ejecutado tras creación exitosa.
     - card-form: Clase CSS para estilos de formulario tipo tarjeta.
   Funciones:
     - crear(e): Handler de submit con validación y limpieza de form.
     - handleChange(field, value): Actualiza campo específico del estado.
   ============================================================= */
// Nombre de la función: UserCreateForm
// Parámetros: { adminService, mostrarMensaje, onUserCreated }
// Proceso y salida: Renderiza form controlado, valida campos requeridos, crea usuario y resetea form tras éxito.
const UserCreateForm = ({ adminService, mostrarMensaje, onUserCreated }) => {
  const [nuevo, setNuevo] = useState({ 
    username: '', 
    password: '', 
    role: 'user' 
  });

  const crear = async (e) => {
    e.preventDefault();
    if (!nuevo.username || !nuevo.password) return;
    
    try {
      await adminService.crearUsuario(nuevo);
      mostrarMensaje('Usuario creado');
      setNuevo({ username: '', password: '', role: 'user' });
      onUserCreated();
    } catch (e) { 
      mostrarMensaje(e.message, 'error'); 
    }
  };

  const handleChange = (field, value) => {
    setNuevo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={crear} className="card-form">
      <h3>Crear Usuario</h3>
      <label>Usuario
        <input 
          value={nuevo.username} 
          onChange={e => handleChange('username', e.target.value)} 
          required 
        />
      </label>
      <label>Contraseña
        <input 
          type="password" 
          autoComplete="new-password" 
          value={nuevo.password} 
          onChange={e => handleChange('password', e.target.value)} 
          required 
        />
      </label>
      <label>Rol
        <select 
          value={nuevo.role} 
          onChange={e => handleChange('role', e.target.value)}
        >
          <option value="user">Usuario</option>
          <option value="super">Super</option>
        </select>
      </label>
      <button className="btn btn-primary" type="submit">Crear</button>
    </form>
  );
};

export default UserCreateForm;