const ticket = (sequelize, type) => {
    return sequelize.define('tickets', {
        idTicket: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        ticketCode: {
            type: type.STRING,
            unique: true
        },
        microserviceTicketId: type.STRING, // ID del ticket en el microservicio específico
        ticketType: type.STRING,
        priceTicket: type.DECIMAL(10, 2),
        statusTicket: {
            type: type.ENUM('reserved', 'paid', 'used', 'cancelled', 'refunded'),
            defaultValue: 'reserved'
        },
        purchaseDate: type.DATE,
        qrCode: type.TEXT,
        createTicket: type.STRING,
        updateTicket: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla Maestra de Tickets'
    })
}

module.exports = ticket;