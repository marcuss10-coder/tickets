const staff = (sequelize, type) => {
    return sequelize.define('staffs', {
        idStaff: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameStaff: type.STRING,
        emailStaff: {
            type: type.STRING,
            unique: true
        },
        phoneStaff: type.STRING,
        positionStaff: type.STRING,
        departmentStaff: type.STRING,
        hireDate: type.DATE,
        salaryStaff: type.DECIMAL(10, 2),
        workSchedule: type.TEXT, // JSON string
        permissions: type.TEXT, // JSON string
        statusStaff: {
            type: type.ENUM('active', 'inactive', 'on_leave', 'terminated'),
            defaultValue: 'active'
        },
        stateStaff: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createStaff: type.STRING,
        updateStaff: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Personal/Staff'
    })
}

module.exports = staff;