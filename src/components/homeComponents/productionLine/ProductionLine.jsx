import './productionLine.css';

const ProductionLine = () => {
    
    const products = [
        {
            id: 1,
            name: 'Ladrillo de perforación vertical',
            imgUrl: '/ladrilloPerforacionVertical.png',
        },
        {
            id: 2,
            name: 'Ladrillo para fachada',
            imgUrl: '/ladrilloFachada.png',
        },
        {
            id: 3,
            name: 'Ladrillo para levante de muros',
            imgUrl: '/ladrilloLevanteMuros.png',
        },
        {
            id: 4,
            name: 'Bloquelon',
            imgUrl: '/bloquelon.png',
        }
    ]

    return (
        <div className="production-container">
            <h2 className="section-title">Nuestras Lineas de Producción</h2>
            <div className="production-line">
                {products.map(product => (
                    <div key={product.id} className="product-card">
                        <img src={product.imgUrl} alt={product.name} />
                        <p>{product.name}</p>
                </div>
            ))}
        </div>
        </div>
    );

}

export default ProductionLine;