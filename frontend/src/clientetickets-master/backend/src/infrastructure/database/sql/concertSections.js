const concertSection = (sequelize, type) => {
    return sequelize.define('concertSections', {
        idConcertSection: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        sectionName: type.STRING,
        capacity: type.INTEGER,
        basePrice: type.DECIMAL(10, 2),
        sectionType: {
            type: type.ENUM('seated', 'standing', 'vip_box'),
            defaultValue: 'seated'
        },
        viewQuality: {
            type: type.ENUM('excellent', 'good', 'average', 'limited'),
            defaultValue: 'good'
        },
        amenities: type.TEXT,
        stateConcertSection: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createConcertSection: type.STRING,
        updateConcertSection: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Secciones de Conciertos'
    })
}

module.exports = concertSection;