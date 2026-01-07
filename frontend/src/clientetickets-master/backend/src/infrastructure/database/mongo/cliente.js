const mongoose = require('mongoose')

const clienteSchema = new mongoose.Schema({
    direccionCliente:String,
    telefonoCliente:String,
    emailCliente:String,
    tipoCliente: String,
    idClienteSql: String,
})

// Verificar si el modelo ya existe antes de crearlo
const cliente = mongoose.models.clientes || mongoose.model('clientes', clienteSchema)

module.exports = cliente 
