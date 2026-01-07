const cinema = (sequelize, type) => {
    return sequelize.define('cinemas', {
        idCinema: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameCinema: type.STRING,
        addressCinema: type.TEXT,
        phoneCinema: type.STRING,
        emailCinema: type.STRING,
        latitudeCinema: type.DECIMAL(10, 8),
        longitudeCinema: type.DECIMAL(11, 8),
        ratingCinema: {
            type: type.DECIMAL(3, 2),
            defaultValue: 0.0
        },
        stateCinema: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        popularCinema: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        createCinema: type.STRING,
        updateCinema: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Cines'
    })
}

module.exports = cinema;