const express = require('express');
const router = express.Router();

const { 
    mostrarClientes, 
    crearCliente, 
    actualizarCliente, 
    eliminarCliente 
} = require('../../http/controllers/cliente.controller');

// Obtener todos los clientes
router.get('/lista', mostrarClientes);

// Crear nuevo cliente
router.post('/crear', crearCliente);

// Actualizar un cliente existente
router.put('/actualizar/:id', actualizarCliente);

// Eliminar (desactivar) un cliente
router.delete('/eliminar/:id', eliminarCliente);

module.exports = router;
