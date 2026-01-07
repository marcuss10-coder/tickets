const transportReservation = (sequelize, type) => {
    return sequelize.define('transportReservations', {
        idTransportReservation: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        reservationCode: {
            type: type.STRING,
            unique: true
        },
        passengerName: type.STRING,
        passengerDocument: type.STRING, // Para vuelos
        passengerEmail: type.STRING,
        passengerPhone: type.STRING,
        bookingClass: {
            type: type.ENUM('economy', 'business', 'first_class', 'premium'),
            defaultValue: 'economy'
        },
        priceReservation: type.DECIMAL(8, 2),
        statusReservation: {
            type: type.ENUM('confirmed', 'checked_in', 'boarded', 'cancelled', 'no_show'),
            defaultValue: 'confirmed'
        },
        specialRequests: type.TEXT, // Comida especial, asistencia, etc.
        checkInTime: type.DATE,
        luggageInfo: type.TEXT, // JSON string
        createTransportReservation: type.STRING,
        updateTransportReservation: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Reservas de Transporte'
    })
}

module.exports = transportReservation;