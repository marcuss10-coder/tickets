const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { 
    mostrarEventos, crearEvento, mostrarTicketsUsuario, crearTicket,
    obtenerDashboard, buscarEventos, obtenerStaffEventos, asignarStaffEvento,
    obtenerNotificaciones, marcarNotificacionLeida, validarTicketQR,
    cancelarEvento, editarEvento, eliminarEvento
} = require('../../http/controllers/event.controller');

// Validaciones
const validacionEvento = [
    body('nameEvent').notEmpty().withMessage('Nombre del evento es obligatorio'),
    body('eventType').isIn(['cinema', 'concert', 'transport']).withMessage('Tipo de evento inválido'),
    body('microserviceEventId').notEmpty().withMessage('ID de microservicio es obligatorio'),
    body('dateTimeEvent').isISO8601().withMessage('Fecha y hora deben ser válidas')
];

const validacionTicket = [
    body('eventId').isInt({ min: 1 }).withMessage('ID de evento debe ser válido'),
    body('usuarioId').isInt({ min: 1 }).withMessage('ID de usuario debe ser válido'),
    body('microserviceTicketId').notEmpty().withMessage('ID de microservicio es obligatorio'),
    body('priceTicket').isFloat({ min: 0 }).withMessage('Precio del ticket debe ser válido')
];

const validacionAsignacionStaff = [
    body('staffId').isInt({ min: 1 }).withMessage('ID de staff debe ser válido'),
    body('assignmentType').isIn(['cinema', 'concert', 'transport', 'general']).withMessage('Tipo de asignación inválido'),
    body('assignmentDate').isISO8601().withMessage('Fecha de asignación debe ser válida'),
    body('startTime').notEmpty().withMessage('Hora de inicio es obligatoria'),
    body('endTime').notEmpty().withMessage('Hora de fin es obligatoria')
];

// Rutas de Eventos Generales
router.get('/eventos', mostrarEventos);
router.post('/eventos', validacionEvento, crearEvento);
router.get('/eventos/buscar', buscarEventos);
router.put('/eventos/:id/cancelar', cancelarEvento);
router.put('/eventos/:id', editarEvento);
router.delete('/eventos/:id', eliminarEvento);


// Rutas de Tickets
router.get('/usuarios/:usuarioId/tickets', mostrarTicketsUsuario);
router.post('/tickets', validacionTicket, crearTicket);
router.post('/tickets/validar', validarTicketQR);

// Dashboard y Estadísticas
router.get('/dashboard', obtenerDashboard);

// Rutas de Staff
router.get('/staff', obtenerStaffEventos);
router.post('/staff/asignar', validacionAsignacionStaff, asignarStaffEvento);

// Rutas de Notificaciones
router.get('/usuarios/:usuarioId/notificaciones', obtenerNotificaciones);
router.put('/notificaciones/:id/leer', marcarNotificacionLeida);

module.exports = router;
