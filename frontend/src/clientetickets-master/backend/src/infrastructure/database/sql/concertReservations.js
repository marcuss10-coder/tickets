const concertReservation = (sequelize, type) => {
    return sequelize.define('concertReservations', {
        idConcertReservation: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        reservationCode: {
            type: type.STRING,
            unique: true
        },
        ticketType: type.STRING,
        pricePaid: type.DECIMAL(10, 2),
        statusReservation: {
            type: type.ENUM('reserved', 'confirmed', 'cancelled', 'used'),
            defaultValue: 'reserved'
        },
        specialRequests: type.TEXT,
        accessibilityNeeds: type.TEXT,
        purchaseDate: type.DATE,
        createConcertReservation: type.STRING,
        updateConcertReservation: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Reservas de Conciertos'
    })
}

module.exports = concertReservation;