const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { 
    mostrarRoles,
    crearRol,
    actualizarRol,
    eliminarRol,
    obtenerRol,
    buscarRoles,
    cambiarEstado,
    obtenerEstadisticas,
    crearRolesPorDefecto
} = require('../../http/controllers/rol.controller');

// Middleware de autenticación (opcional, descomenta si lo necesitas)
// const isLoggedIn = require('../../lib/auth');

// Validaciones para crear rol
const validacionCrearRol = [
    body('nameRol')
        .notEmpty()
        .withMessage('El nombre del rol es obligatorio')
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre del rol debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre del rol solo puede contener letras y espacios'),
    
    body('descriptionRol')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La descripción no puede exceder 255 caracteres')
];

// Validaciones para actualizar rol
const validacionActualizarRol = [
    body('nameRol')
        .notEmpty()
        .withMessage('El nombre del rol es obligatorio')
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre del rol debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre del rol solo puede contener letras y espacios'),
    
    body('descriptionRol')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La descripción no puede exceder 255 caracteres')
];

// Validación para cambiar estado
const validacionEstado = [
    body('estado')
        .isIn(['activo', 'inactivo'])
        .withMessage('Estado debe ser: activo o inactivo')
];

// ================ RUTAS DE ROLES ================

// Obtener todos los roles
router.get('/lista', mostrarRoles);

// Obtener un rol específico por ID
router.get('/obtener/:id', obtenerRol);

// Buscar roles por término
router.get('/buscar', buscarRoles);

// Obtener estadísticas de roles
router.get('/estadisticas', obtenerEstadisticas);

// Crear nuevo rol
router.post('/crear', validacionCrearRol, crearRol);

// Crear roles por defecto del sistema
router.post('/por-defecto', crearRolesPorDefecto);

// Actualizar rol existente
router.put('/actualizar/:id', validacionActualizarRol, actualizarRol);

// Cambiar estado de rol
router.put('/cambiar-estado/:id', validacionEstado, cambiarEstado);

// Eliminar (desactivar) rol
router.delete('/eliminar/:id', eliminarRol);

module.exports = router;
