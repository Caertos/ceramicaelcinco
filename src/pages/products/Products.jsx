import { useCallback, useState } from "react";
import PageContainer from "../../components/pageContainer/PageContainer";
import Banner from "../../components/banner/Banner";
import ProductionLine from "../../components/productionLine/ProductionLine";

function Products() {
  const [selectedPdf, setSelectedPdf] = useState("");

const handlePdfSelect = useCallback((path) => {
    setSelectedPdf(path);
  }, []);

  return (
    <>
      <Banner
        bannerImg="/productBanner.webp"
        bannerAlt={"Banner Productos Ceramica el Cinco"}
      />
      <PageContainer>
        <h2 className="section-title section-title-contact">
          Nuestra línea de productos
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
