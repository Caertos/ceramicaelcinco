import { Link } from 'react-router-dom';
import './notFound.css';

/*
Resumen:
Página 404 genérica con enlace de retorno al inicio.

Diccionario:
- 404: Código de recurso no encontrado.

Parámetros:
(Sin props) Render estático.

Proceso y salida:
Renderiza encabezado 404, mensaje y Link a '/'.

Notas:
- Puede ampliarse con búsqueda o enlaces útiles.
*/
function NotFound() {
  return (
    <div className="not-found-container">
      <h1>404</h1>
      <h2>Página no encontrada</h2>
      <p>Lo sentimos, la página que estás buscando no existe.</p>
      <Link to="/" className="back-home-button">
        Volver al inicio
      </Link>
    </div>
  );
}

export default NotFound;