const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { 
    procesarPago, confirmarTransaccion, procesarReembolso, obtenerHistorialTransacciones,
    obtenerTransaccion, obtenerEstadisticasVentas, webhookPasarela, validarEstadoTransaccion,
    cancelarTransaccion
} = require('../../http/controllers/transaction.controller');

// Validaciones para procesar pago
const validacionPago = [
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Monto debe ser mayor a 0'),
    
    body('currency')
        .optional()
        .isIn(['USD', 'EUR', 'MXN', 'COP', 'PEN', 'CLP'])
        .withMessage('Moneda no soportada'),
    
    body('paymentMethod')
        .isIn(['CreditCard', 'DebitCard', 'PayPal', 'Transfer', 'Cash'])
        .withMessage('Método de pago inválido'),
    
    body('paymentProvider')
        .optional()
        .isIn(['Stripe', 'PayPal', 'Cash', 'Bank'])
        .withMessage('Proveedor de pago inválido'),
    
    body('usuarioId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de usuario debe ser válido'),
    
    body('reservationId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de reserva debe ser válido')
];

// Validaciones para confirmar transacción
const validacionConfirmacion = [
    body('externalReference')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Referencia externa no puede exceder 100 caracteres'),
    
    body('providerResponse')
        .optional()
        .isObject()
        .withMessage('Respuesta del proveedor debe ser un objeto')
];

// Validaciones para reembolso
const validacionReembolso = [
    body('refundAmount')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Monto de reembolso debe ser mayor a 0'),
    
    body('refundReason')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Razón del reembolso no puede exceder 255 caracteres')
];

// Validaciones para webhook
const validacionWebhook = [
    body('transactionNumber')
        .notEmpty()
        .withMessage('Número de transacción es obligatorio'),
    
    body('status')
        .notEmpty()
        .withMessage('Estado es obligatorio'),
    
    body('externalReference')
        .optional()
        .isString()
        .withMessage('Referencia externa debe ser texto')
];

// ================ RUTAS DE TRANSACCIONES ================
router.post('/procesar', validacionPago, procesarPago);
router.put('/:id/confirmar', validacionConfirmacion, confirmarTransaccion);
router.post('/:id/reembolso', validacionReembolso, procesarReembolso);
router.get('/historial', obtenerHistorialTransacciones);
router.get('/estadisticas', obtenerEstadisticasVentas);
router.get('/:id', obtenerTransaccion);
router.get('/validar/:transactionNumber', validarEstadoTransaccion);
router.put('/:id/cancelar', cancelarTransaccion);

// ================ WEBHOOK ================
router.post('/webhook', validacionWebhook, webhookPasarela);

module.exports = router;
