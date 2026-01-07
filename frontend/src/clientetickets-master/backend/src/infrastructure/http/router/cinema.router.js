const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { 
    mostrarCines, crearCine, obtenerSalasCine, crearSala,
    mostrarPeliculas, crearPelicula, obtenerFuncionesPelicula, crearFuncion,
    obtenerReservasUsuario, crearReserva, obtenerEstadisticas 
} = require('../../http/controllers/cinema.controller');

// Validaciones
const validacionCine = [
    body('nameCinema').notEmpty().withMessage('Nombre del cine es obligatorio'),
    body('addressCinema').notEmpty().withMessage('Dirección es obligatoria')
];

const validacionSala = [
    body('nameRoom').notEmpty().withMessage('Nombre de la sala es obligatorio'),
    body('numberRoom').isInt({ min: 1 }).withMessage('Número de sala debe ser válido'),
    body('totalCapacity').isInt({ min: 1 }).withMessage('Capacidad debe ser válida')
];

const validacionPelicula = [
    body('titleMovie').notEmpty().withMessage('Título es obligatorio'),
    body('durationMinutes').isInt({ min: 1 }).withMessage('Duración debe ser válida'),
    body('releaseDate').isISO8601().withMessage('Fecha de estreno debe ser válida')
];

const validacionFuncion = [
    body('movieId').isInt({ min: 1 }).withMessage('ID de película debe ser válido'),
    body('roomId').isInt({ min: 1 }).withMessage('ID de sala debe ser válido'),
    body('dateFunction').isISO8601().withMessage('Fecha debe ser válida'),
    body('basePrice').isFloat({ min: 0 }).withMessage('Precio debe ser válido')
];

// Rutas de Cines
router.get('/cines', mostrarCines);
router.post('/cines', validacionCine, crearCine);
router.get('/cines/:cinemaId/salas', obtenerSalasCine);
router.post('/cines/:cinemaId/salas', validacionSala, crearSala);

// Rutas de Películas
router.get('/peliculas', mostrarPeliculas);
router.post('/peliculas', validacionPelicula, crearPelicula);
router.get('/peliculas/:movieId/funciones', obtenerFuncionesPelicula);
router.post('/funciones', validacionFuncion, crearFuncion);

// Rutas de Reservas
router.get('/usuarios/:usuarioId/reservas', obtenerReservasUsuario);
router.post('/reservas', crearReserva);

// Estadísticas
router.get('/estadisticas', obtenerEstadisticas);

module.exports = router;
