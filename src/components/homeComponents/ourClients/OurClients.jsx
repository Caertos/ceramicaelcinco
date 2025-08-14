import "./ourClients.css";

const OurClients = () => {

    const clients = [
        {
            id: 1,
            name: "Nombre de la empresa",
            logo: "/logoEmpresa.svg",
        },
                {
            id: 2,
            name: "Nombre de la empresa",
            logo: "/logoEmpresa.svg",
        },
                {
            id: 3,
            name: "Nombre de la empresa",
            logo: "/logoEmpresa.svg",
        },
                {
            id: 4,
            name: "Nombre de la empresa",
            logo: "/logoEmpresa.svg",
        },
                {
            id: 5,
            name: "Nombre de la empresa",
            logo: "/logoEmpresa.svg",
        },
    ];

    return (
        <section className="our-clients-container">
            <h2 className="section-title2">Nuestros Clientes</h2>
            <div className="clients-list">
                {clients.map(client => (
                    <div key={client.id} className="client-item">
                        <img src={client.logo} alt={client.name} />
                    </div>
                ))}
            </div>
        </section>
    );

}

export default OurClients;