const transaction = (sequelize, type) => {
    return sequelize.define('transactions', {
        idTransaction: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        transactionNumber: {
            type: type.STRING,
            unique: true
        },
        paymentMethod: {
            type: type.ENUM('CreditCard', 'DebitCard', 'PayPal', 'Transfer', 'Cash'),
            defaultValue: 'CreditCard'
        },
        paymentProvider: {
            type: type.ENUM('Stripe', 'PayPal', 'Cash', 'Bank'),
            defaultValue: 'Stripe'
        },
        amount: type.DECIMAL(10, 2),
        currency: {
            type: type.STRING(3),
            defaultValue: 'USD'
        },
        stateTransaction: {
            type: type.ENUM('Pending', 'Processing', 'Completed', 'Failed', 'Refunded'),
            defaultValue: 'Pending'
        },
        externalReference: type.STRING,
        processingDate: type.DATE,
        completedDate: type.DATE,
        refundAmount: type.DECIMAL(10, 2),
        refundDate: type.DATE,
        processorCommission: type.DECIMAL(8, 2),
        createTransaction: type.STRING,
        updateTransaction: type.STRING,
    }, {
        timestamps: false,
        comment: 'Tabla de Transacciones'
    })
}

module.exports = transaction;