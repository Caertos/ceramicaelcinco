import PropTypes from 'prop-types';

/*
Resumen:
Contenedor de layout que aplica anchura máxima y padding horizontal uniforme.

Diccionario:
- page-container: Clase CSS que centraliza el contenido y limita ancho.

Parámetros:
- children (ReactNode): Contenido arbitrario a envolver.

Proceso y salida:
Devuelve <div className="page-container"> con children para unificar estilos de página.

Notas:
- Puede ampliarse con prop as para personalizar el elemento HTML.
- Variantes de densidad (wide/narrow) pendientes.
*/
function PageContainer({ children }) {
  return <div className="page-container">{children}</div>;
}

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageContainer;
