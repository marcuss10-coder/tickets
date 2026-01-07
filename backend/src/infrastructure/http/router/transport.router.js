const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { 
    mostrarEmpresas, crearEmpresa, mostrarRutas, crearRuta,
    obtenerVehiculosEmpresa, crearVehiculo, obtenerHorariosVehiculo,
    crearHorario, obtenerAsientosVehiculo, crearAsientosVehiculo,
    obtenerReservasHorario, crearReservaTransporte, buscarRutas,
    obtenerEstadisticas, actualizarEstadoVehiculo, actualizarEstadoHorario,
    checkInPasajero
} = require('../../http/controllers/trasport.controller');

// Validaciones
const validacionEmpresa = [
    body('nameCompany').notEmpty().withMessage('Nombre de la empresa es obligatorio'),
    body('licenseNumber').notEmpty().withMessage('Número de licencia es obligatorio'),
    body('contactEmail').isEmail().withMessage('Email debe ser válido')
];

const validacionRuta = [
    body('routeName').notEmpty().withMessage('Nombre de la ruta es obligatorio'),
    body('transportType').isIn(['bus', 'metro', 'flight', 'train', 'taxi', 'boat']).withMessage('Tipo de transporte inválido'),
    body('origin').notEmpty().withMessage('Origen es obligatorio'),
    body('destination').notEmpty().withMessage('Destino es obligatorio'),
    body('companyId').isInt({ min: 1 }).withMessage('ID de empresa debe ser válido')
];

const validacionVehiculo = [
    body('vehicleCode').notEmpty().withMessage('Código del vehículo es obligatorio'),
    body('transportType').isIn(['bus', 'metro', 'flight', 'train', 'taxi', 'boat']).withMessage('Tipo de transporte inválido'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacidad debe ser válida'),
    body('vehicleModel').notEmpty().withMessage('Modelo del vehículo es obligatorio')
];

const validacionHorario = [
    body('vehicleId').isInt({ min: 1 }).withMessage('ID de vehículo debe ser válido'),
    body('routeId').isInt({ min: 1 }).withMessage('ID de ruta debe ser válido'),
    body('departureTime').isISO8601().withMessage('Hora de salida debe ser válida'),
    body('arrivalTime').isISO8601().withMessage('Hora de llegada debe ser válida'),
    body('priceSchedule').isFloat({ min: 0 }).withMessage('Precio debe ser válido')
];

const validacionReservaTransporte = [
    body('usuarioId').isInt({ min: 1 }).withMessage('ID de usuario debe ser válido'),
    body('scheduleId').isInt({ min: 1 }).withMessage('ID de horario debe ser válido'),
    body('passengerName').notEmpty().withMessage('Nombre del pasajero es obligatorio'),
    body('passengerEmail').isEmail().withMessage('Email del pasajero debe ser válido'),
    body('priceReservation').isFloat({ min: 0 }).withMessage('Precio de reserva debe ser válido')
];

// Rutas de Empresas
router.get('/empresas', mostrarEmpresas);
router.post('/empresas', validacionEmpresa, crearEmpresa);
router.get('/empresas/:companyId/vehiculos', obtenerVehiculosEmpresa);
router.post('/empresas/:companyId/vehiculos', validacionVehiculo, crearVehiculo);

// Rutas de Rutas
router.get('/rutas', mostrarRutas);
router.post('/rutas', validacionRuta, crearRuta);
router.get('/rutas/buscar', buscarRutas);

// Rutas de Vehículos y Horarios
router.get('/vehiculos/:vehicleId/horarios', obtenerHorariosVehiculo);
router.post('/horarios', validacionHorario, crearHorario);
router.get('/vehiculos/:vehicleId/asientos', obtenerAsientosVehiculo);
router.post('/vehiculos/:vehicleId/asientos', crearAsientosVehiculo);
router.put('/vehiculos/:id/estado', actualizarEstadoVehiculo);
router.put('/horarios/:id/estado', actualizarEstadoHorario);

// Rutas de Reservas
router.get('/horarios/:scheduleId/reservas', obtenerReservasHorario);
router.post('/reservas', validacionReservaTransporte, crearReservaTransporte);
router.put('/reservas/:id/checkin', checkInPasajero);

// Estadísticas
router.get('/estadisticas', obtenerEstadisticas);

module.exports = router;
