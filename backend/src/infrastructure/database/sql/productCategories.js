const productCategory = (sequelize, type) => {
    return sequelize.define('productCategories', {
        idProductCategory: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameCategory: {
            type: type.STRING,
            unique: true
        },
        descriptionCategory: type.TEXT,
        iconCategory: type.STRING,
        displayOrder: {
            type: type.INTEGER,
            defaultValue: 0
        },
        stateCategory: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createCategory: type.STRING,
        updateCategory: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Categorías de Productos'
    })
}

module.exports = productCategory;