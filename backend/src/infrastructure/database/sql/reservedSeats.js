const reservedSeat = (sequelize, type) => {
    return sequelize.define('reservedSeats', {
        idReservedSeat: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        paidPrice: type.DECIMAL(8, 2),
        ticketType: {
            type: type.ENUM('Regular', 'VIP', 'Premium', 'Student', 'Senior'),
            defaultValue: 'Regular'
        },
        appliedDiscount: {
            type: type.DECIMAL(8, 2),
            defaultValue: 0.00
        },
        createReservedSeat: type.STRING,
        updateReservedSeat: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Asientos Reservados'
    })
}

module.exports = reservedSeat;