const express = require('express');
const router = express.Router();

const { 
    mostrarCiudades, 
    crearCiudad, 
    actualizarCiudad, 
    eliminarCiudad 
} = require('../../http/controllers/city.controller');

// Obtener todas las ciudades
router.get('/lista', mostrarCiudades);

// Crear nueva ciudad
router.post('/crear', crearCiudad);

// Actualizar una ciudad existente
router.put('/actualizar/:id', actualizarCiudad);

// Eliminar (desactivar) una ciudad
router.delete('/eliminar/:id', eliminarCiudad);

module.exports = router;
