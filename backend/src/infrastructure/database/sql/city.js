const city = (sequelize, type) => {
    return sequelize.define('cities', {
        idCity: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameCity: type.STRING,
        postalCode: type.STRING,
        stateCity: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createCity: type.STRING,
        updateCity: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Ciudades'
    })
}

module.exports = city;