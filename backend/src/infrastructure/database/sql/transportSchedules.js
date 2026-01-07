const transportSchedule = (sequelize, type) => {
    return sequelize.define('transportSchedules', {
        idTransportSchedule: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        departureTime: type.DATE,
        arrivalTime: type.DATE,
        priceSchedule: type.DECIMAL(8, 2),
        availableSeats: type.INTEGER,
        statusSchedule: {
            type: type.ENUM('scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed'),
            defaultValue: 'scheduled'
        },
        gateTerminal: type.STRING, // Para vuelos
        platform: type.STRING, // Para trenes/metro
        delayMinutes: type.INTEGER,
        delayReason: type.TEXT,
        stateSchedule: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createSchedule: type.STRING,
        updateSchedule: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Horarios de Transporte'
    })
}

module.exports = transportSchedule;