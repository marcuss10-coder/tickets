const country = (sequelize, type) => {
    return sequelize.define('countries', {
        idCountry: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        isoCode: {
            type: type.STRING(2),
            unique: true
        },
        nameCountry: type.STRING,
        stateCountry: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createCountry: type.STRING,
        updateCountry: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Países'
    })
}

module.exports = country;