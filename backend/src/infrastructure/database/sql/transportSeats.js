const transportSeat = (sequelize, type) => {
    return sequelize.define('transportSeats', {
        idTransportSeat: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        seatNumber: type.STRING, // 1A, 1B, etc.
        seatClass: {
            type: type.ENUM('economy', 'business', 'first_class', 'premium'),
            defaultValue: 'economy'
        },
        seatType: {
            type: type.ENUM('window', 'aisle', 'middle'),
            defaultValue: 'aisle'
        },
        amenities: type.TEXT, // JSON string
        statusSeat: {
            type: type.ENUM('available', 'occupied', 'maintenance', 'reserved'),
            defaultValue: 'available'
        },
        additionalFee: type.DECIMAL(8, 2),
        stateSeat: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createSeat: type.STRING,
        updateSeat: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Asientos de Transporte'
    })
}

module.exports = transportSeat;