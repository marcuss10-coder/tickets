const reservation = (sequelize, type) => {
    return sequelize.define('reservations', {
        idReservation: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        codeReservation: {
            type: type.STRING,
            unique: true
        },
        dateReservation: type.DATE,
        expirationDate: type.DATE,
        numberSeats: type.INTEGER,
        subtotalTickets: type.DECIMAL(10, 2),
        subtotalProducts: {
            type: type.DECIMAL(10, 2),
            defaultValue: 0.00
        },
        serviceCommission: {
            type: type.DECIMAL(10, 2),
            defaultValue: 0.00
        },
        discounts: {
            type: type.DECIMAL(10, 2),
            defaultValue: 0.00
        },
        totalReservation: type.DECIMAL(10, 2),
        paymentMethod: {
            type: type.ENUM('CreditCard', 'DebitCard', 'PayPal', 'Transfer', 'Cash'),
            defaultValue: 'CreditCard'
        },
        paymentReference: type.STRING,
        stateReservation: {
            type: type.ENUM('Pending', 'Confirmed', 'Paid', 'Cancelled', 'Expired'),
            defaultValue: 'Pending'
        },
        originReservation: {
            type: type.ENUM('Web', 'Mobile', 'BoxOffice', 'Phone'),
            defaultValue: 'Web'
        },
        createReservation: type.STRING,
        updateReservation: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Reservas'
    })
}

module.exports = reservation;