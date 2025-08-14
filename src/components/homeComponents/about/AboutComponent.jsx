import "./aboutComponent.css";

const AboutComponent = () => {
  return (
    <div className="about-container">
      <h2 className="section-title">¿Quienes somos?</h2>
      <div className="about">
        <p>
          Somos una empresa dedicada a la fabricación de ladrillos cerámicos de
          la más alta calidad, comprometida con la innovación y la excelencia en
          cada producto. Nuestro objetivo es posicionarnos como el principal
          referente en la industria de materiales derivados de la arcilla para
          el sector de la construcción, ofreciendo soluciones confiables,
          sostenibles y adaptadas a las exigencias del mercado moderno.
        </p>
        <img
          src="/worker.png"
          alt="trabajadorLadrillos"
          className="worker-image"
        />
      </div>
    </div>
  );
};

export default AboutComponent;
