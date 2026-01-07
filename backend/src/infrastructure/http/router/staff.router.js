const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { 
    mostrarStaff, crearStaff, obtenerStaff, actualizarStaff, 
    cambiarEstadoStaff, eliminarStaff, buscarStaff,
    obtenerAsignaciones, crearAsignacion, actualizarEstadoAsignacion,
    obtenerEstadisticas, obtenerHorarioStaff
} = require('../../http/controllers/staff.controller');

// Validaciones para crear staff
const validacionCrearStaff = [
    body('nameStaff')
        .notEmpty()
        .withMessage('Nombre del personal es obligatorio')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('emailStaff')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    
    body('phoneStaff')
        .optional()
        .isMobilePhone()
        .withMessage('Debe ser un número de teléfono válido'),
    
    body('positionStaff')
        .notEmpty()
        .withMessage('Puesto es obligatorio')
        .isLength({ min: 2, max: 50 })
        .withMessage('El puesto debe tener entre 2 y 50 caracteres'),
    
    body('departmentStaff')
        .notEmpty()
        .withMessage('Departamento es obligatorio')
        .isIn(['cinema', 'concert', 'transport', 'administration', 'security', 'maintenance', 'customer_service'])
        .withMessage('Departamento inválido'),
    
    body('usuarioId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de usuario debe ser válido'),
    
    body('hireDate')
        .optional()
        .isISO8601()
        .withMessage('Fecha de contratación debe ser válida'),
    
    body('salaryStaff')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Salario debe ser un número positivo'),
    
    body('statusStaff')
        .optional()
        .isIn(['active', 'inactive', 'on_leave', 'terminated'])
        .withMessage('Estado inválido'),
    
    body('workSchedule')
        .optional()
        .isObject()
        .withMessage('Horario de trabajo debe ser un objeto'),
    
    body('permissions')
        .optional()
        .isObject()
        .withMessage('Permisos debe ser un objeto')
];

// Validaciones para actualizar staff
const validacionActualizarStaff = [
    body('nameStaff')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('emailStaff')
        .optional()
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    
    body('phoneStaff')
        .optional()
        .isMobilePhone()
        .withMessage('Debe ser un número de teléfono válido'),
    
    body('positionStaff')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('El puesto debe tener entre 2 y 50 caracteres'),
    
    body('departmentStaff')
        .optional()
        .isIn(['cinema', 'concert', 'transport', 'administration', 'security', 'maintenance', 'customer_service'])
        .withMessage('Departamento inválido'),
    
    body('salaryStaff')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Salario debe ser un número positivo'),
    
    body('statusStaff')
        .optional()
        .isIn(['active', 'inactive', 'on_leave', 'terminated'])
        .withMessage('Estado inválido')
];

// Validaciones para cambiar estado
const validacionEstado = [
    body('statusStaff')
        .isIn(['active', 'inactive', 'on_leave', 'terminated'])
        .withMessage('Estado debe ser: active, inactive, on_leave, terminated')
];

// Validaciones para crear asignación
const validacionAsignacion = [
    body('staffId')
        .isInt({ min: 1 })
        .withMessage('ID de staff debe ser válido'),
    
    body('assignmentType')
        .isIn(['cinema', 'concert', 'transport', 'general'])
        .withMessage('Tipo de asignación debe ser: cinema, concert, transport, general'),
    
    body('assignmentDate')
        .isISO8601()
        .withMessage('Fecha de asignación debe ser válida'),
    
    body('startTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Hora de inicio debe tener formato HH:MM'),
    
    body('endTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Hora de fin debe tener formato HH:MM')
        .custom((endTime, { req }) => {
            if (endTime <= req.body.startTime) {
                throw new Error('Hora de fin debe ser posterior a hora de inicio');
            }
            return true;
        }),
    
    body('locationId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de ubicación debe ser válido'),
    
    body('locationAssignment')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Ubicación no puede exceder 255 caracteres'),
    
    body('responsibilitiesAssignment')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Responsabilidades no pueden exceder 500 caracteres')
];

// Validaciones para actualizar estado de asignación
const validacionEstadoAsignacion = [
    body('statusAssignment')
        .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
        .withMessage('Estado debe ser: scheduled, in_progress, completed, cancelled')
];

// Validaciones para parámetros
const validacionParametroId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID debe ser un número entero positivo')
];

const validacionParametroStaffId = [
    param('staffId')
        .isInt({ min: 1 })
        .withMessage('ID de staff debe ser un número entero positivo')
];

// ================ RUTAS DE GESTIÓN DE STAFF ================

// Obtener todo el personal con filtros y paginación
router.get('/lista', mostrarStaff);

// Obtener un miembro del staff por ID
router.get('/obtener/:id', validacionParametroId, obtenerStaff);

// Buscar personal
router.get('/buscar', buscarStaff);

// Obtener estadísticas del personal
router.get('/estadisticas', obtenerEstadisticas);

// Crear nuevo miembro del staff
router.post('/crear', validacionCrearStaff, crearStaff);

// Actualizar miembro del staff
router.put('/actualizar/:id', validacionParametroId, validacionActualizarStaff, actualizarStaff);

// Cambiar estado del staff
router.put('/cambiar-estado/:id', validacionParametroId, validacionEstado, cambiarEstadoStaff);

// Eliminar (desactivar) staff
router.delete('/eliminar/:id', validacionParametroId, eliminarStaff);

// ================ RUTAS DE ASIGNACIONES ================

// Obtener asignaciones con filtros
router.get('/asignaciones', obtenerAsignaciones);

// Crear nueva asignación
router.post('/asignaciones/crear', validacionAsignacion, crearAsignacion);

// Actualizar estado de asignación
router.put('/asignaciones/:id/estado', validacionParametroId, validacionEstadoAsignacion, actualizarEstadoAsignacion);

// Obtener horario de un staff específico
router.get('/:staffId/horario', validacionParametroStaffId, obtenerHorarioStaff);

module.exports = router;
