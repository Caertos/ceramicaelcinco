import Banner from "../../components/banner/Banner";
import AboutComponent from "../../components/homeComponents/about/AboutComponent";
import HowWeDoIt from "../../components/homeComponents/howWeDoIt/HowWeDoIt";
import OurClients from "../../components/homeComponents/ourClients/OurClients";
import PageContainer from "../../components/pageContainer/PageContainer";

function Home() {
  return (
    <>
      <div className="video-container">
        <video autoPlay loop muted preload="auto" className="video-banner">
          <source src="/Videoweb.webm" type="video/webm" />
        </video>
      </div>
      <PageContainer>
        <AboutComponent />
        <HowWeDoIt />
      </PageContainer>
      <OurClients />
    </>
  );
}

export default Home;
