const concert = (sequelize, type) => {
    return sequelize.define('concerts', {
        idConcert: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameConcert: type.STRING,
        tourName: type.STRING,
        descriptionConcert: type.TEXT,
        dateConcert: type.DATE,
        startTime: type.TIME,
        endTime: type.TIME,
        ageRestriction: type.INTEGER,
        durationMinutes: type.INTEGER,
        soundCheckTime: type.TIME,
        setupRequirements: type.TEXT,
        technicalRider: type.TEXT,
        ticketPrice: type.DECIMAL(10, 2),
        vipPrice: type.DECIMAL(10, 2),
        statusConcert: {
            type: type.ENUM('scheduled', 'confirmed', 'cancelled', 'completed'),
            defaultValue: 'scheduled'
        },
        stateConcert: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createConcert: type.STRING,
        updateConcert: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Conciertos'
    })
}

module.exports = concert;