const genre = (sequelize, type) => {
    return sequelize.define('genres', {
        idGenre: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameGenre: {
            type: type.STRING,
            unique: true
        },
        descriptionGenre: type.TEXT,
        colorHex: type.STRING(7),
        stateGenre: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createGenre: type.STRING,
        updateGenre: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Géneros'
    })
}

module.exports = genre;