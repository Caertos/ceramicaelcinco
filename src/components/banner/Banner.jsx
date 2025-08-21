const Banner = ({ bannerImg, bannerAlt }) => {
  return (
    <div className="banner">
      <img src={bannerImg} alt={bannerAlt} />
    </div>
  );
}

export default Banner;
