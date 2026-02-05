import React, { useState } from 'react';

/* =============================================================
   Componente: ForcePasswordForm
   Resumen: Formulario para que super admin fuerce cambio de contraseña a cualquier usuario por ID.
   Diccionario:
     - pwdChange: Estado del formulario { userId, newPassword }.
     - forzarCambioContrasena: Método admin para reset forzado.
     - autoComplete="new-password": Evita autollenado de contraseñas guardadas.
   Funciones:
     - forzarPwd(e): Handler de submit con validación y reset.
     - handleChange(field, value): Actualiza campo específico del estado.
   ============================================================= */
// Nombre de la función: ForcePasswordForm
// Parámetros: { adminService, mostrarMensaje }
// Proceso y salida: Renderiza form para reset forzado, valida campos, ejecuta cambio y resetea sin callback de recarga.
const ForcePasswordForm = ({ adminService, mostrarMensaje }) => {
  const [pwdChange, setPwdChange] = useState({ 
    userId: '', 
    newPassword: '' 
  });

  const forzarPwd = async (e) => {
    e.preventDefault();
    if (!pwdChange.userId || !pwdChange.newPassword) return;
    
    try {
      await adminService.forzarCambioContrasena(Number(pwdChange.userId), pwdChange.newPassword);
      mostrarMensaje('Contraseña forzada actualizada');
      setPwdChange({ userId: '', newPassword: '' });
    } catch (e) { 
      mostrarMensaje(e.message, 'error'); 
    }
  };

  const handleChange = (field, value) => {
    setPwdChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={forzarPwd} className="card-form">
      <h3>Forzar Reset Contraseña</h3>
      <label>ID Usuario
        <input 
          value={pwdChange.userId} 
          onChange={e => handleChange('userId', e.target.value)} 
          required 
        />
      </label>
      <label>Nueva Contraseña
        <input 
          type="password" 
          autoComplete="new-password" 
          value={pwdChange.newPassword} 
          onChange={e => handleChange('newPassword', e.target.value)} 
          required 
        />
      </label>
      <button className="btn btn-warning" type="submit">Forzar</button>
    </form>
  );
};

export default ForcePasswordForm;