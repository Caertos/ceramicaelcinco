import React from 'react';

/* =============================================================
   Componente: AdminMessagesDisplay
   Resumen: Componente para mostrar mensajes de estado del sistema con estilos diferenciados por tipo.
   Diccionario:
     - message: Objeto con texto y tipo de mensaje { text: string, type: 'success'|'error'|'warning' }.
     - message-success/error/warning: Clases CSS para diferentes tipos de mensajes.
   Funciones:
     - AdminMessagesDisplay({ message }): Renderiza mensaje si existe texto, aplica clase CSS según tipo.
   ============================================================= */
// Nombre de la función: AdminMessagesDisplay
// Parámetros: { message: { text: string, type: string } }
// Proceso y salida: Renderiza condicionalmente mensaje con clase CSS dinámica según tipo, retorna null si no hay texto.
const AdminMessagesDisplay = ({ message }) => {
  if (!message.text) return null;
  
  return (
    <div className={`message message-${message.type}`}>
      {message.text}
    </div>
  );
};

export default AdminMessagesDisplay;