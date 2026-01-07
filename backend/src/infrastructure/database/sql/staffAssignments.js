const staffAssignment = (sequelize, type) => {
    return sequelize.define('staffAssignments', {
        idStaffAssignment: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        assignmentType: {
            type: type.ENUM('cinema', 'concert', 'transport', 'general'),
            allowNull: false
        },
        assignmentDate: type.DATE,
        startTime: type.TIME,
        endTime: type.TIME,
        locationAssignment: type.STRING,
        responsibilitiesAssignment: type.TEXT,
        statusAssignment: {
            type: type.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
            defaultValue: 'scheduled'
        },
        stateAssignment: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createAssignment: type.STRING,
        updateAssignment: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Asignaciones de Personal'
    })
}

module.exports = staffAssignment;