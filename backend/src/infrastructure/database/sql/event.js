const event = (sequelize, type) => {
    return sequelize.define('events', {
        idEvent: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameEvent: type.STRING,
        descriptionEvent: type.TEXT,
        eventType: {
            type: type.ENUM('cinema', 'concert', 'transport'),
            allowNull: false
        },
        microserviceEventId: type.STRING, // ID del evento en el microservicio específico
        venue: type.STRING,
        dateTimeEvent: type.DATE,
        capacity: type.INTEGER,
        statusEvent: {
            type: type.ENUM('draft', 'published', 'cancelled', 'completed'),
            defaultValue: 'draft'
        },
        imageUrl: type.STRING,
        stateEvent: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createEvent: type.STRING,
        updateEvent: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla Maestra de Eventos'
    })
}

module.exports = event;