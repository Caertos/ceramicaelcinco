import { useGalleryData } from "./hooks/useGalleryData";
import { usePagination } from "./hooks/usePagination";
import { useLightbox } from "./hooks/useLightbox";
import { useDocumentMeta, pageMetaConfig } from "../../hooks/useDocumentMeta";

import Banner from "../../components/banner/Banner";
import PageContainer from "../../components/pageContainer/PageContainer";
import TypeToggle from "./galleryComponents/controllers/TypeToggle";
import GalleryContent from "./components/GalleryContent";
import GalleryLightboxes from "./components/GalleryLightboxes";

import "./gallery.css";

/* =============================================================
   Componente: Gallery (Refactorizado)
   Resumen: Galería de imágenes/videos con arquitectura modular usando hooks especializados para datos, paginación y lightbox.
   Diccionario:
     - galleryData: Estado completo de datos gestionado por hook dedicado.
     - paginationData: Lógica de paginación extraída en hook reutilizable.
     - lightboxLogic: Gestión de lightbox con validaciones automáticas.
     - componentized UI: Componentes especializados para contenido y lightboxes.
   Funciones:
     - Gallery(): Coordina hooks especializados y renderiza layout con componentes modulares.
   ============================================================= */
// Nombre de la función: Gallery
// Parámetros: (ninguno)
// Proceso y salida: 
// 1. Utiliza hooks especializados para datos, paginación y lightbox.
// 2. Renderiza banner, controles y contenido usando componentes modulares.
// 3. Coordina comunicación entre hooks y componentes de UI.
// Refactorización: Separación total de responsabilidades en hooks y componentes especializados.

function Gallery() {
  // SEO: Configurar meta tags para la página de Galería
  useDocumentMeta(pageMetaConfig.gallery);

  // Hook para gestionar datos de galería (fotos/videos)
  const galleryData = useGalleryData();
  
  // Hook para gestionar paginación
  const paginationData = usePagination({ 
    items: galleryData.items, 
    pageSize: 6 
  });
  
  // Hook para gestionar lightbox
  const lightboxLogic = useLightbox({ 
    pageItems: paginationData.pageItems, 
    tipoActual: galleryData.tipoActual 
  });

  return (
    <>
      <Banner bannerImg="/galleryBanner.webp" bannerAlt={"Banner Galería Ceramica el Cinco"} />
      <PageContainer>
        <h2 className="section-title">Galería</h2>
        <TypeToggle 
          isActive={galleryData.isActive} 
          setIsActive={galleryData.setIsActive} 
        />

        <GalleryContent
          loading={galleryData.loading}
          showLoader={galleryData.showLoader}
          error={galleryData.error}
          pageItems={paginationData.pageItems}
          onImageClick={lightboxLogic.openLightbox}
          totalPages={paginationData.totalPages}
          page={paginationData.page}
          setPage={paginationData.setPage}
          items={galleryData.items}
          pageSize={paginationData.pageSize}
        />
      </PageContainer>

      <GalleryLightboxes
        currentItem={lightboxLogic.currentItem}
        lightboxIndex={lightboxLogic.lightboxIndex}
        items={galleryData.items}
        sliceStart={paginationData.sliceStart}
        pageSize={paginationData.pageSize}
        page={paginationData.page}
        setPage={paginationData.setPage}
        setLightboxIndex={lightboxLogic.setLightboxIndex}
        onClose={lightboxLogic.closeLightbox}
        isLightboxOpen={lightboxLogic.isLightboxOpen}
      />
    </>
  );
}
export default Gallery;