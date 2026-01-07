const concertSeat = (sequelize, type) => {
    return sequelize.define('concertSeats', {
        idConcertSeat: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        rowIdentifier: type.STRING,
        seatNumber: type.INTEGER,
        seatType: {
            type: type.ENUM('regular', 'vip', 'wheelchair', 'standing'),
            defaultValue: 'regular'
        },
        positionX: type.INTEGER,
        positionY: type.INTEGER,
        viewLine: {
            type: type.ENUM('clear', 'partial', 'obstructed'),
            defaultValue: 'clear'
        },
        stateConcertSeat: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createConcertSeat: type.STRING,
        updateConcertSeat: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Asientos de Conciertos'
    })
}

module.exports = concertSeat;