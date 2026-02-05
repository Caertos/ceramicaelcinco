import { useCallback, useState } from "react";
import PageContainer from "../../components/pageContainer/PageContainer";
import Banner from "../../components/banner/Banner";
import ProductionLine from "../../components/productionLine/ProductionLine";
import { useDocumentMeta, pageMetaConfig } from "../../hooks/useDocumentMeta";

/* =============================================================
   Componente: Products
   Resumen: Página de catálogo que muestra línea de productos y gestiona el PDF seleccionado actualmente.
   Diccionario:
     - selectedPdf: Ruta/URL del PDF activo que el usuario ha abierto.
     - ProductionLine: Componente hijo que lista categorías/productos y emite selecciones.
   Funciones:
     - Products(): Componente principal (sin props) que coordina estado y renderiza layout.
     - handlePdfSelect(path): Actualiza el estado local con el PDF seleccionado.
   ============================================================= */
// Nombre de la función: Products
// Parámetros: (ninguno)
// Proceso y salida: Renderiza banner + título + ProductionLine; mantiene selectedPdf para posible uso futuro (descarga/visor).
function Products() {
  // SEO: Configurar meta tags para la página de Productos
  useDocumentMeta(pageMetaConfig.products);

  const [selectedPdf, setSelectedPdf] = useState("");

const handlePdfSelect = useCallback((path) => {
    setSelectedPdf(path);
  }, []);

  return (
    <>
      <Banner
        bannerImg="/ProductosBanner.webp"
        bannerAlt={"Banner Productos Ceramica el Cinco"}
      />
      <PageContainer>
        <h2 className="section-title">
          Línea de productos
        </h2>

        <ProductionLine
          onPdfSelect={handlePdfSelect}
          selectedPdf={selectedPdf}
        />
      </PageContainer>
    </>
  );
}

export default Products;
