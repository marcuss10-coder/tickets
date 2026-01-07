const artist = (sequelize, type) => {
    return sequelize.define('artists', {
        idArtist: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameArtist: type.STRING,
        genreArtist: type.STRING,
        countryOrigin: type.STRING,
        biography: type.TEXT,
        socialMediaLinks: type.TEXT,
        contactInfo: type.TEXT,
        statusArtist: {
            type: type.ENUM('active', 'inactive', 'on_tour'),
            defaultValue: 'active'
        },
        stateArtist: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createArtist: type.STRING,
        updateArtist: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Artistas'
    })
}

module.exports = artist;