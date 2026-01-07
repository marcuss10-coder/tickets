const transportVehicle = (sequelize, type) => {
    return sequelize.define('transportVehicles', {
        idTransportVehicle: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        vehicleCode: {
            type: type.STRING,
            unique: true
        },
        transportType: {
            type: type.ENUM('bus', 'metro', 'flight', 'train', 'taxi', 'boat'),
            allowNull: false
        },
        capacity: type.INTEGER,
        vehicleModel: type.STRING,
        licensePlate: type.STRING,
        yearVehicle: type.INTEGER,
        fuelType: {
            type: type.ENUM('gasoline', 'diesel', 'electric', 'hybrid'),
            defaultValue: 'gasoline'
        },
        facilities: type.TEXT, // JSON string
        safetyFeatures: type.TEXT,
        lastMaintenance: type.DATE,
        nextMaintenance: type.DATE,
        statusVehicle: {
            type: type.ENUM('active', 'maintenance', 'out_of_service'),
            defaultValue: 'active'
        },
        stateVehicle: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createVehicle: type.STRING,
        updateVehicle: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Vehículos de Transporte'
    })
}

module.exports = transportVehicle;