const product = (sequelize, type) => {
    return sequelize.define('products', {
        idProduct: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nameProduct: type.STRING,
        descriptionProduct: type.TEXT,
        priceProduct: type.DECIMAL(8, 2),
        ingredients: type.TEXT,
        allergens: type.TEXT,
        availableProduct: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        stockProduct: type.INTEGER,
        popularProduct: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        newProduct: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        discountPercentage: {
            type: type.DECIMAL(5, 2),
            defaultValue: 0.00
        },
        discountStartDate: type.DATE,
        discountEndDate: type.DATE,
        ratingProduct: {
            type: type.DECIMAL(3, 2),
            defaultValue: 0.0
        },
        voteCount: {
            type: type.INTEGER,
            defaultValue: 0
        },
        stateProduct: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        createProduct: type.STRING,
        updateProduct: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Productos'
    })
}

module.exports = product;