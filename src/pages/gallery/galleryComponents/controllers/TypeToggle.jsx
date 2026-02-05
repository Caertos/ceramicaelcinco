import React from 'react';
import '../../gallery.css';

/*
Resumen:
Toggle de tipo galería (fotos vs videos) mediante dos botones con icono.

Diccionario:
- aria-pressed: Indica estado activo del botón.

Parámetros:
- isActive (bool): true = videos, false = fotos.
- setIsActive (fn): Actualiza estado en padre.

Proceso y salida:
Renderiza grupo de dos botones; clic cambia tipo llamando setIsActive.

Notas:
- Podría extraerse labels a constantes para i18n.
*/

const GalleryButton = ({ active, onClick, iconSrc, label }) => (
  <button
    type="button"
    className={`galery-btn ${active ? 'gallery-btn-active' : ''}`}
    onClick={onClick}
    aria-pressed={active}
    aria-label={label}
    title={label}
  >
    {/* El icono es decorativo porque el botón ya tiene aria-label */}
    <img src={iconSrc} alt="" aria-hidden="true" />
  </button>
);

const TypeToggle = ({ isActive, setIsActive }) => (
  <div className="gallery-btns-container" role="group" aria-label="Tipo de elementos a mostrar">
    <GalleryButton
      active={!isActive}
      onClick={() => setIsActive(false)}
      iconSrc="/Camera.svg"
      label="Mostrar fotos"
    />
    <GalleryButton
      active={isActive}
      onClick={() => setIsActive(true)}
      iconSrc="/Video.svg"
      label="Mostrar videos"
    />
  </div>
);

export default TypeToggle;
