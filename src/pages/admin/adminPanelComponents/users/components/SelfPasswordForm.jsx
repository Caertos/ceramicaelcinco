import React, { useState } from 'react';

/* =============================================================
   Componente: SelfPasswordForm
   Resumen: Formulario para que el super admin cambie su propia contraseña con verificación de contraseña actual.
   Diccionario:
     - selfPwd: Estado del formulario { current, nueva }.
     - cambiarContrasenaPropia: Método que requiere contraseña actual para verificación.
     - autoComplete: Directivas para gestión correcta de contraseñas por navegador.
   Funciones:
     - cambiarPropia(e): Handler de submit con validación dual y reset.
     - handleChange(field, value): Actualiza campo específico del estado.
   ============================================================= */
// Nombre de la función: SelfPasswordForm
// Parámetros: { adminService, mostrarMensaje }
// Proceso y salida: Renderiza form con contraseña actual/nueva, valida ambos campos, ejecuta cambio y resetea.
const SelfPasswordForm = ({ adminService, mostrarMensaje }) => {
  const [selfPwd, setSelfPwd] = useState({ 
    current: '', 
    nueva: '' 
  });

  const cambiarPropia = async (e) => {
    e.preventDefault();
    if (!selfPwd.current || !selfPwd.nueva) return;
    
    try {
      await adminService.cambiarContrasenaPropia(selfPwd.current, selfPwd.nueva);
      mostrarMensaje('Tu contraseña ha sido cambiada');
      setSelfPwd({ current: '', nueva: '' });
    } catch (e) { 
      mostrarMensaje(e.message, 'error'); 
    }
  };

  const handleChange = (field, value) => {
    setSelfPwd(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={cambiarPropia} className="card-form">
      <h3>Mi Contraseña (Super)</h3>
      <label>Actual
        <input 
          type="password" 
          autoComplete="current-password" 
          value={selfPwd.current} 
          onChange={e => handleChange('current', e.target.value)} 
          required 
        />
      </label>
      <label>Nueva
        <input 
          type="password" 
          autoComplete="new-password" 
          value={selfPwd.nueva} 
          onChange={e => handleChange('nueva', e.target.value)} 
          required 
        />
      </label>
      <button className="btn btn-primary" type="submit">Cambiar</button>
    </form>
  );
};

export default SelfPasswordForm;