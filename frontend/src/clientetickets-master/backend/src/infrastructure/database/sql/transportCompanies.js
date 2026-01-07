const transportCompany = (sequelize, type) => {
    return sequelize.define('transportCompanies', {
        idTransportCompany: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameCompany: type.STRING,
        licenseNumber: type.STRING,
        contactEmail: type.STRING,
        contactPhone: type.STRING,
        addressCompany: type.TEXT,
        websiteCompany: type.STRING,
        ratingCompany: {
            type: type.DECIMAL(3, 2),
            defaultValue: 0.0
        },
        statusCompany: {
            type: type.ENUM('active', 'suspended', 'inactive'),
            defaultValue: 'active'
        },
        stateCompany: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createCompany: type.STRING,
        updateCompany: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Empresas de Transporte'
    })
}

module.exports = transportCompany;