const seat = (sequelize, type) => {
    return sequelize.define('seats', {
        idSeat: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        rowSeat: type.STRING,
        numberSeat: type.INTEGER,
        typeSeat: {
            type: type.ENUM('Regular', 'VIP', 'Premium', 'Disabled'),
            defaultValue: 'Regular'
        },
        additionalPrice: {
            type: type.DECIMAL(8, 2),
            defaultValue: 0.00
        },
        stateSeat: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        positionX: type.INTEGER,
        positionY: type.INTEGER,
        createSeat: type.STRING,
        updateSeat: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Asientos'
    })
}

module.exports = seat;