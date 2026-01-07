const func = (sequelize, type) => {
    return sequelize.define('functions', {
        idFunction: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        dateFunction: type.DATE,
        startTime: type.TIME,
        endTime: type.TIME,
        formatFunction: {
            type: type.ENUM('2D', '3D', 'IMAX', '4DX'),
            defaultValue: '2D'
        },
        languageFunction: type.STRING,
        subtitlesFunction: type.STRING,
        basePrice: type.DECIMAL(8, 2),
        vipPrice: type.DECIMAL(8, 2),
        premiumPrice: type.DECIMAL(8, 2),
        availableSeats: type.INTEGER,
        reservedSeats: {
            type: type.INTEGER,
            defaultValue: 0
        },
        soldSeats: {
            type: type.INTEGER,
            defaultValue: 0
        },
        stateFunction: {
            type: type.ENUM('Scheduled', 'InProgress', 'Finished', 'Cancelled'),
            defaultValue: 'Scheduled'
        },
        activeFunction: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createFunction: type.STRING,
        updateFunction: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Funciones'
    })
}

module.exports = func;