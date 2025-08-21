import Banner from "../../components/banner/Banner";
import AboutComponent from "../../components/homeComponents/about/AboutComponent";
import ProductionLine from "../../components/homeComponents/productionLine/ProductionLine";
import HowWeDoIt from "../../components/homeComponents/howWeDoIt/HowWeDoIt";
import OurClients from "../../components/homeComponents/ourClients/OurClients";
import PageContainer from "../../components/pageContainer/PageContainer";

function Home() {
  return (
    <>
      <Banner bannerImg="/banner.png" bannerAlt={"Banner Ceramica el Cinco"} />
      <PageContainer>
        <AboutComponent />
        <ProductionLine />
        <HowWeDoIt />
      </PageContainer>
      <OurClients />
    </>
  );
}

export default Home;
