import React from 'react';
import './sidebar.css';

/*
Resumen:
Sidebar de navegación del panel admin con items condicionales para super.

Diccionario:
- isSuper: Flag que habilita vistas avanzadas.

Parámetros:
- current (string)
- onChange (fn)
- isSuper (bool)

Proceso y salida:
Genera lista de botones; item activo recibe clase destacada.

Notas:
- Podría integrarse con rutas para deep-linking.
*/

const Sidebar = ({ current, onChange, isSuper = false }) => {
  const items = [
    { key: 'categorias', label: 'Categorías' },
    { key: 'productos', label: 'Productos' },
    { key: 'galeria', label: 'Galería' },
    { key: 'minislides', label: 'Mini Slides' },
    ...(isSuper ? [
      { key: 'usuarios', label: 'Usuarios' },
      { key: 'logs', label: 'Logs' }
    ] : []),
  ];
  return (
    <nav className="admin-sidebar" aria-label="Navegación del panel de administración">
      <ul>
        {items.map(it => (
          <li key={it.key} className={current === it.key ? 'active-sidebar' : ''}>
            <button type="button" onClick={() => onChange(it.key)}>{it.label}</button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
