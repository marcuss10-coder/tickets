const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { 
    mostrarArtistas, crearArtista, mostrarVenues, crearVenue,
    obtenerSeccionesVenue, crearSeccion, mostrarConciertos, crearConcierto,
    obtenerReservasConcierto, crearReservaConcierto, obtenerAsientosSeccion,
    crearAsientosSeccion, obtenerEstadisticas, actualizarEstadoArtista,
    cancelarReservaConcierto
} = require('../../http/controllers/concert.controller');

// Validaciones
const validacionArtista = [
    body('nameArtist').notEmpty().withMessage('Nombre del artista es obligatorio'),
    body('genreArtist').notEmpty().withMessage('Género es obligatorio')
];

const validacionVenue = [
    body('nameVenue').notEmpty().withMessage('Nombre del venue es obligatorio'),
    body('addressVenue').notEmpty().withMessage('Dirección es obligatoria'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacidad debe ser válida'),
    body('venueType').isIn(['stadium', 'arena', 'theater', 'outdoor', 'club']).withMessage('Tipo de venue inválido')
];

const validacionSeccion = [
    body('sectionName').notEmpty().withMessage('Nombre de la sección es obligatorio'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacidad debe ser válida'),
    body('basePrice').isFloat({ min: 0 }).withMessage('Precio base debe ser válido')
];

const validacionConcierto = [
    body('nameConcert').notEmpty().withMessage('Nombre del concierto es obligatorio'),
    body('artistId').isInt({ min: 1 }).withMessage('ID de artista debe ser válido'),
    body('venueId').isInt({ min: 1 }).withMessage('ID de venue debe ser válido'),
    body('dateConcert').isISO8601().withMessage('Fecha debe ser válida'),
    body('ticketPrice').isFloat({ min: 0 }).withMessage('Precio del ticket debe ser válido')
];

const validacionReservaConcierto = [
    body('usuarioId').isInt({ min: 1 }).withMessage('ID de usuario debe ser válido'),
    body('concertId').isInt({ min: 1 }).withMessage('ID de concierto debe ser válido'),
    body('pricePaid').isFloat({ min: 0 }).withMessage('Precio pagado debe ser válido')
];

// Rutas de Artistas
router.get('/artistas', mostrarArtistas);
router.post('/artistas', validacionArtista, crearArtista);
router.put('/artistas/:id/estado', actualizarEstadoArtista);

// Rutas de Venues
router.get('/venues', mostrarVenues);
router.post('/venues', validacionVenue, crearVenue);
router.get('/venues/:venueId/secciones', obtenerSeccionesVenue);
router.post('/venues/:venueId/secciones', validacionSeccion, crearSeccion);

// Rutas de Conciertos
router.get('/conciertos', mostrarConciertos);
router.post('/conciertos', validacionConcierto, crearConcierto);
router.get('/conciertos/:concertId/reservas', obtenerReservasConcierto);
router.post('/conciertos/reservas', validacionReservaConcierto, crearReservaConcierto);
router.put('/reservas/:id/cancelar', cancelarReservaConcierto);

// Rutas de Asientos
router.get('/secciones/:sectionId/asientos', obtenerAsientosSeccion);
router.post('/secciones/:sectionId/asientos', crearAsientosSeccion);

// Estadísticas
router.get('/estadisticas', obtenerEstadisticas);

module.exports = router;
