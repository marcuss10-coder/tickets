const mongoose = require('mongoose')

const clienteSchema = new mongoose.Schema({
    direccionCliente:String,
    telefonoCliente:String,
    emailCliente:String,
    tipoCliente: String,
    idClienteSql: String,
})

const cliente = mongoose.model('clientes', clienteSchema)

module.exports = cliente 