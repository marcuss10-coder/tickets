const express = require('express');
const router = express.Router();

const { 
    mostrarClasificaciones, 
    crearClasificacion, 
    actualizarClasificacion, 
    eliminarClasificacion 
} = require('../../http/controllers/classifications.controller');

// Obtener todas las clasificaciones
router.get('/lista', mostrarClasificaciones);

// Crear nueva clasificación
router.post('/crear', crearClasificacion);

// Actualizar una clasificación existente
router.put('/actualizar/:id', actualizarClasificacion);

// Eliminar (desactivar) una clasificación
router.delete('/eliminar/:id', eliminarClasificacion);

module.exports = router;
