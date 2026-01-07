const cliente = (sequelize, type) =>{
    return sequelize.define('clientes',{
        idClientes: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        cedulaCliente: type.STRING,
        nombreCliente: type.STRING,
        usernameCliente: type.STRING,
        passwordCliente: type.STRING,
        stadoCliente: type.STRING,
        createCliente: type.STRING,
        updateCliente: type.STRING,
    },{
        timestamps: false,
        Comment: 'Tabla Clientes'
    })
}

module.exports = cliente