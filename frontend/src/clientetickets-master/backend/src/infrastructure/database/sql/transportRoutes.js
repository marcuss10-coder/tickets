const transportRoute = (sequelize, type) => {
    return sequelize.define('transportRoutes', {
        idTransportRoute: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        routeName: type.STRING,
        transportType: {
            type: type.ENUM('bus', 'metro', 'flight', 'train', 'taxi', 'boat'),
            allowNull: false
        },
        origin: type.STRING,
        destination: type.STRING,
        distanceKm: type.DECIMAL(8, 2),
        estimatedDuration: type.INTEGER, // En minutos
        routeCode: type.STRING,
        waypoints: type.TEXT, // JSON string con puntos intermedios
        tollCosts: type.DECIMAL(8, 2),
        statusRoute: {
            type: type.ENUM('active', 'suspended', 'maintenance'),
            defaultValue: 'active'
        },
        stateRoute: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createRoute: type.STRING,
        updateRoute: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Rutas de Transporte'
    })
}

module.exports = transportRoute;