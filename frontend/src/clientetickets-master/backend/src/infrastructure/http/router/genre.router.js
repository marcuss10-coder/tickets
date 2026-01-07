const express = require('express');
const router = express.Router();

const { 
    mostrarGeneros, 
    crearGenero, 
    actualizarGenero, 
    eliminarGenero 
} = require('../../http/controllers/genres.controller');

// Obtener todos los géneros
router.get('/lista', mostrarGeneros);

// Crear nuevo género
router.post('/crear', crearGenero);

// Actualizar un género existente
router.put('/actualizar/:id', actualizarGenero);

// Eliminar (desactivar) un género
router.delete('/eliminar/:id', eliminarGenero);

module.exports = router;
