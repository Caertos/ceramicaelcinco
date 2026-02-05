import React from 'react';
import Loader from '../../../components/common/Loader';
import GalleryGrid from '../galleryComponents/grid/GalleryGrid';
import Pagination from '../galleryComponents/controllers/Pagination';

/* =============================================================
   Componente: GalleryContent
   Resumen: Componente que renderiza el contenido principal de la galería con estados de carga, error y paginación.
   Diccionario:
     - aria-busy: Atributo de accesibilidad para indicar estado de carga.
     - aria-live: Región que anuncia cambios de estado a lectores de pantalla.
     - pageItems: Elementos de la página actual.
     - showPagination: Condicional para mostrar paginación solo si hay múltiples páginas.
   Funciones:
     - GalleryContent(props): Renderiza contenido con manejo de estados y controles.
   ============================================================= */
// Nombre de la función: GalleryContent
// Parámetros: { loading, showLoader, error, pageItems, onImageClick, totalPages, page, setPage, items, pageSize }
// Proceso y salida: Renderiza contenido de galería con loader, mensajes de error/vacío, grid de items y paginación condicional.
const GalleryContent = ({
  loading,
  showLoader,
  error,
  pageItems,
  onImageClick,
  totalPages,
  page,
  setPage,
  items,
  pageSize
}) => {
  return (
    <div className="gallery-content-wrapper" aria-busy={loading}>
      <div aria-live="polite" role="status">
        {error && <div className="gallery-error">{error}</div>}
        {!loading && !error && pageItems.length === 0 && (
          <p className="gallery-empty">No hay elementos.</p>
        )}
      </div>
      
      {showLoader && <Loader message="Cargando galería…" />}
      
      <GalleryGrid items={pageItems} onImageClick={onImageClick} />
      
      <Pagination 
        totalPages={totalPages} 
        page={page} 
        setPage={setPage} 
        show={items.length > pageSize} 
      />
    </div>
  );
};

export default GalleryContent;