const room = (sequelize, type) => {
    return sequelize.define('rooms', {
        idRoom: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameRoom: type.STRING,
        numberRoom: type.INTEGER,
        typeRoom: {
            type: type.ENUM('Regular', 'VIP', 'IMAX', '4DX', 'Premium'),
            defaultValue: 'Regular'
        },
        totalCapacity: type.INTEGER,
        rows: type.INTEGER,
        basePrice: type.DECIMAL(8, 2),
        stateRoom: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createRoom: type.STRING,
        updateRoom: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Salas'
    })
}

module.exports = room;