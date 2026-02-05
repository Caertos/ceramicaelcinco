import React from 'react';
import './floatingWhatsapp.css';

/*
Resumen:
Botón flotante fijo que abre conversación de WhatsApp con mensaje prellenado.

Diccionario:
- encodeURIComponent: Codifica texto para insertarlo en URL.
- aria-label: Texto accesible que describe la acción del enlace.

Parámetros:
- phone (string, default 573206812493)
- message (string, default 'Hola, quisiera más información.')
- position (object, default { bottom: '18px', right: '18px' })

Proceso y salida:
1. Codifica message.
2. Construye URL wa.me/<phone>?text=<encoded>.
3. Devuelve <a target="_blank" rel="noopener noreferrer"> con ícono.

Notas:
- Se puede añadir prop ariaLabel para personalizar accesibilidad.
- Optimizable con import dinámico del SVG.
*/
export default function FloatingWhatsappButton({
  phone = '573206812493',
  message = 'Hola, quisiera más información.',
  position = { bottom: '18px', right: '18px' }
}) {
  // Proceso: se codifica el mensaje para evitar ruptura de la URL.
  const encodedMsg = encodeURIComponent(message);
  const href = `https://wa.me/${phone}?text=${encodedMsg}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      className="floating-whatsapp-btn"
      style={position}
    >
      <img src="/whatsapp.svg" alt="WhatsApp" loading="lazy" />
    </a>
  );
}
