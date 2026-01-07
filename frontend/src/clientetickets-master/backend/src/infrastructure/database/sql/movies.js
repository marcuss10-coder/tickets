const movie = (sequelize, type) => {
    return sequelize.define('movies', {
        idMovie: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        titleMovie: type.STRING,
        originalTitle: type.STRING,
        synopsis: type.TEXT,
        durationMinutes: type.INTEGER,
        releaseDate: type.DATE,
        endDate: type.DATE,
        originalLanguage: type.STRING,
        budget: type.DECIMAL(15, 2),
        revenue: type.DECIMAL(15, 2),
        distributor: type.STRING,
        countryOrigin: type.STRING,
        ratingMovie: {
            type: type.DECIMAL(3, 2),
            defaultValue: 0.0
        },
        voteCount: {
            type: type.INTEGER,
            defaultValue: 0
        },
        popularMovie: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        newMovie: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        featuredMovie: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        stateMovie: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createMovie: type.STRING,
        updateMovie: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Películas'
    })
}

module.exports = movie;