import { useState } from 'react';
import './contactDirectory.css';

/*
Resumen:
Directorio de contactos en acordeón simple por departamento.

Diccionario:
- toggle: Acción de abrir/cerrar un panel.

Parámetros:
(No props) Datos internos constantes.

Proceso y salida:
1. Renderiza lista de departamentos.
2. Click en cabecera alterna Set de IDs abiertos.
3. Panel muestra celular y correo (o 'No disponible').
4. Devuelve <div> con lista accesible role=list.

Notas:
- Puede externalizar datos a un JSON / servicio.
- Faltan tests de accesibilidad (teclas Enter/Espacio en botón ya cubiertas por rol nativo).
*/
const DEPARTAMENTOS = [
  { id: 'ventas', nombre: 'Ventas', celular: '321 563 01 05', correo: 'ventas@ceramicaselcinco.com' },
  { id: 'tesoreria', nombre: 'Tesorería', celular: '320 505 05 05', correo: 'tesoreria1@ceramicaselcinco.com' },
  { id: 'compras', nombre: 'Compras', celular: '320 681 24 93', correo: 'compras@ceramicaselcinco.com' },
  { id: 'contabilidad', nombre: 'Contabilidad', celular: '321 563 24 91', correo: 'despachos@ceramicaselcinco.com' },
  { id: 'rrhh', nombre: 'Recursos Humanos', celular: '313 602 7084', correo: 'gestionhumana@ceramicaselcinco.com' }
];

function normalizarNumero(num) { return num.replace(/\s+/g, ''); }

export default function ContactDirectory() {
  const [openItems, setOpenItems] = useState(() => new Set());

  const toggleItem = (id) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="contact-directory" aria-labelledby="directorio-title">
      <h3 id="directorio-title" className="directory-title">Directorio</h3>
      <ul className="directory-list" role="list">
        {DEPARTAMENTOS.map(dep => {
          const abierto = openItems.has(dep.id);
          const telHref = `tel:${normalizarNumero(dep.celular)}`;
          const mailHref = dep.correo ? `mailto:${dep.correo}` : null;
          return (
            <li key={dep.id} className={`directory-item ${abierto ? 'open' : ''}`}>
              <button
                type="button"
                className="accordion-trigger"
                aria-expanded={abierto}
                aria-controls={`panel-${dep.id}`}
                id={`accordion-${dep.id}`}
                onClick={() => toggleItem(dep.id)}
              >
                <span className="accordion-title">{dep.nombre}</span>
                <span className="accordion-icon" aria-hidden="true">{abierto ? '−' : '+'}</span>
              </button>
              <div
                id={`panel-${dep.id}`}
                role="region"
                aria-labelledby={`accordion-${dep.id}`}
                className="accordion-panel"
                hidden={!abierto}
              >
                <div className="dir-data">
                  <div className="dir-line">
                    <span className="label">Celular:</span>
                    <a href={telHref} className="link tel-link">{dep.celular}</a>
                  </div>
                  <div className="dir-line">
                    <span className="label">Correo:</span>
                    {dep.correo ? (
                      <a href={mailHref} className="link mail-link">{dep.correo}</a>
                    ) : (
                      <span className="no-data">No disponible</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
