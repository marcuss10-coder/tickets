const classification = (sequelize, type) => {
    return sequelize.define('classifications', {
        idClassification: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        codeClassification: {
            type: type.STRING,
            unique: true
        },
        nameClassification: type.STRING,
        descriptionClassification: type.TEXT,
        minimumAge: type.INTEGER,
        requiresCompanion: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        stateClassification: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createClassification: type.STRING,
        updateClassification: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Clasificaciones'
    })
}

module.exports = classification;