const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { 
    obtenerReservasUsuario, modificarReserva, cancelarReserva, confirmarReserva,
    verificarDisponibilidad, agregarListaEspera,
    obtenerHistorialReserva, validarCodigoReserva,
    crearReserva
} = require('../../http/controllers/reservation.controller');

// Validaciones para modificar reserva
const validacionModificarReserva = [
    param('tipo')
        .isIn(['cinema', 'concert', 'transport'])
        .withMessage('Tipo de reserva inválido'),
    
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de reserva debe ser válido'),
    
    body('accion')
        .isIn(['cambiar_fecha', 'cambiar_asientos', 'agregar_servicios'])
        .withMessage('Acción inválida'),
    
    body('datos')
        .isObject()
        .withMessage('Datos deben ser un objeto')
];

// Validaciones para cancelar reserva
const validacionCancelarReserva = [
    param('tipo')
        .isIn(['cinema', 'concert', 'transport'])
        .withMessage('Tipo de reserva inválido'),
    
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de reserva debe ser válido'),
    
    body('motivo')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Motivo no puede exceder 255 caracteres'),
    
    body('reembolso')
        .optional()
        .isBoolean()
        .withMessage('Reembolso debe ser true o false')
];

// Validaciones para confirmar reserva
const validacionConfirmarReserva = [
    param('tipo')
        .isIn(['cinema', 'concert', 'transport'])
        .withMessage('Tipo de reserva inválido'),
    
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de reserva debe ser válido'),
    
    body('metodoPago')
        .optional()
        .isIn(['CreditCard', 'DebitCard', 'PayPal', 'Transfer', 'Cash'])
        .withMessage('Método de pago inválido'),
    
    body('transactionId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de transacción debe ser válido')
];

// Validaciones para verificar disponibilidad
const validacionDisponibilidad = [
    param('tipo')
        .isIn(['cinema', 'concert', 'transport'])
        .withMessage('Tipo de recurso inválido'),
    
    query('resourceId')
        .isInt({ min: 1 })
        .withMessage('ID de recurso debe ser válido'),
    
    query('cantidad')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Cantidad debe estar entre 1 y 10'),
    
    query('fecha')
        .optional()
        .isISO8601()
        .withMessage('Fecha debe ser válida')
];

// Validaciones para lista de espera
const validacionListaEspera = [
    body('usuarioId')
        .isInt({ min: 1 })
        .withMessage('ID de usuario debe ser válido'),
    
    body('tipo')
        .isIn(['cinema', 'concert', 'transport'])
        .withMessage('Tipo de recurso inválido'),
    
    body('resourceId')
        .isInt({ min: 1 })
        .withMessage('ID de recurso debe ser válido'),
    
    body('cantidad')
        .isInt({ min: 1, max: 10 })
        .withMessage('Cantidad debe estar entre 1 y 10'),
    
    body('contactInfo')
        .optional()
        .isObject()
        .withMessage('Información de contacto debe ser un objeto')
];

// ================ RUTAS DE RESERVAS UNIFICADAS ================
router.get('/usuarios/:usuarioId', obtenerReservasUsuario);
router.put('/:tipo/:id/modificar', validacionModificarReserva, modificarReserva);
router.put('/:tipo/:id/cancelar', validacionCancelarReserva, cancelarReserva);
router.put('/:tipo/:id/confirmar', validacionConfirmarReserva, confirmarReserva);
router.get('/:tipo/:id/historial', obtenerHistorialReserva);

// ================ DISPONIBILIDAD Y LISTA DE ESPERA ================
router.get('/disponibilidad/:tipo', validacionDisponibilidad, verificarDisponibilidad);
router.post('/lista-espera', validacionListaEspera, agregarListaEspera);
// ================ CREACIÓN DE RESERVAS ================
router.post('/:tipo/crear', crearReserva);


// ================ VALIDACIÓN Y ESTADÍSTICAS ================
router.get('/validar/:codigo', validarCodigoReserva);


module.exports = router;
