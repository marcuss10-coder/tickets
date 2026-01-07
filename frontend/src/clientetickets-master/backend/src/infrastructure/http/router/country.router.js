const express = require('express');
const router = express.Router();

const { 
    mostrarPaises, 
    crearPais, 
    actualizarPais, 
    eliminarPais 
} = require('../../http/controllers/country.controller');

// Obtener todos los países
router.get('/lista', mostrarPaises);

// Crear nuevo país
router.post('/crear', crearPais);

// Actualizar un país existente
router.put('/actualizar/:id', actualizarPais);

// Eliminar (desactivar) un país
router.delete('/eliminar/:id', eliminarPais);

module.exports = router;
