const role = (sequelize, type) => {
    return sequelize.define('roles', {
        idRole: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameRole: type.STRING,
        descriptionRole: type.STRING,
        stateRole: {
            type: type.ENUM('active', 'inactive'),
            defaultValue: 'active'
        },
        createRole: type.STRING,
        updateRole: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Roles'
    }) 
}

module.exports = role;