/*
Resumen:
Banner de imagen a ancho completo minimalista.

Diccionario:
- bannerImg: Ruta/URL de la imagen.
- bannerAlt: Texto alternativo descriptivo.

Parámetros:
- bannerImg (string)
- bannerAlt (string)

Proceso y salida:
Renderiza wrapper <div.banner> con <img> suministrada.

Notas:
- Puede ampliarse con overlay, children o variantes de tamaño.
- Considerar <picture> para fuentes responsivas.
*/
// Props: { bannerImg (string), bannerAlt (string) }
const Banner = ({ bannerImg, bannerAlt }) => {
  return (
    <div className="banner">
      <img src={bannerImg} alt={bannerAlt} />
    </div>
  );
}

export default Banner;
