import Banner from "../../components/banner/Banner";
import PageContainer from "../../components/pageContainer/PageContainer";
import GeniallyPresentation from "../../components/genially/GeniallyPresentation";
import { useDocumentMeta, pageMetaConfig } from "../../hooks/useDocumentMeta";

/* =============================================================
   Componente: ProductionProcess
   Resumen: Renderiza la página del proceso de producción con una presentación interactiva de Genially.
   Diccionario:
     - GeniallyPresentation: Componente que carga la presentación interactiva del proceso de producción.
     - PageContainer: Contenedor común que centraliza y aplica padding/coherencia al layout.
   Funciones:
     - ProductionProcess(): Componente principal que arma el layout con banner y presentación interactiva.
   ============================================================= */
// Nombre de la función: ProductionProcess
// Parámetros: (ninguno)
// Proceso y salida: Devuelve Banner + título principal + presentación interactiva de Genially dentro de PageContainer.
function ProductionProcess() {
  // SEO: Configurar meta tags para la página de Proceso de Producción
  useDocumentMeta(pageMetaConfig.process);

  return (
    <>
      <Banner
        bannerImg="/HacemosBanner.webp"
        bannerAlt={"Banner Proceso de Producción Ceramica el Cinco"}
      />
      <PageContainer>
        <h2 className="section-title">¿Cómo lo hacemos?</h2>
        <GeniallyPresentation title="¿Cómo lo Hacemos? - Proceso de Producción" />
      </PageContainer>
    </>
  );
}

export default ProductionProcess;
