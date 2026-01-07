const concertVenue = (sequelize, type) => {
    return sequelize.define('concertVenues', {
        idConcertVenue: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameVenue: type.STRING,
        addressVenue: type.TEXT,
        capacity: type.INTEGER,
        venueType: {
            type: type.ENUM('stadium', 'arena', 'theater', 'outdoor', 'club'),
            allowNull: false
        },
        soundSystem: type.STRING,
        lightingSystem: type.STRING,
        stageSize: type.STRING,
        parkingSpaces: type.INTEGER,
        accessibilityFeatures: type.TEXT,
        contactInfo: type.TEXT,
        stateVenue: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createVenue: type.STRING,
        updateVenue: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Venues de Conciertos'
    })
}

module.exports = concertVenue;