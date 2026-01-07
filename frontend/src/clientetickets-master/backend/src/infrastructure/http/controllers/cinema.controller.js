const cinemaCtl = {};
const sql = require('../../../infrastructure/database/connection/dataBase.sql');
const orm = require('../../../infrastructure/database/connection/dataBase.orm');
const mongo = require('../../../infrastructure/database/connection/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../../../application/encrypDates');

// Función para descifrar de forma segura
const descifrarSeguro = (dato) => {
    try {
        return dato ? descifrarDatos(dato) : '';
    } catch (error) {
        console.error('Error al descifrar:', error);
        return '';
    }
};

// Mostrar todos los cines activos con detalles
cinemaCtl.mostrarCines = async (req, res) => {
    try {
        const [listaCines] = await sql.promise().query(`
            SELECT c.*, 
                   COUNT(DISTINCT r.idRoom) as totalSalas,
                   COUNT(DISTINCT f.idFunction) as funcionesActivas,
                   AVG(c.ratingCinema) as promedioRating
            FROM cinemas c
            LEFT JOIN rooms r ON c.idCinema = r.cinemaId AND r.stateRoom = 1
            LEFT JOIN functions f ON r.idRoom = f.roomId AND f.activeFunction = 1
            WHERE c.stateCinema = 1
            GROUP BY c.idCinema
            ORDER BY c.popularCinema DESC, c.createCinema DESC
        `);

        const cinesCompletos = await Promise.all(
            listaCines.map(async (cine) => {
                // Obtener detalles adicionales de MongoDB
                const detallesCine = await mongo.cinemaModel.findOne({ 
                    idCinemaSql: cine.idCinema.toString()
                });

                return {
                    ...cine,
                    nameCinema: descifrarSeguro(cine.nameCinema),
                    addressCinema: descifrarSeguro(cine.addressCinema),
                    phoneCinema: descifrarSeguro(cine.phoneCinema),
                    emailCinema: descifrarSeguro(cine.emailCinema),
                    totalSalas: cine.totalSalas || 0,
                    funcionesActivas: cine.funcionesActivas || 0,
                    detallesAdicionales: detallesCine ? {
                        horarios: detallesCine.openingHours,
                        servicios: detallesCine.services,
                        características: detallesCine.features,
                        descripcion: detallesCine.description,
                        galeria: detallesCine.gallery
                    } : null
                };
            })
        );

        return res.json(cinesCompletos);
    } catch (error) {
        console.error('Error al mostrar cines:', error);
        return res.status(500).json({ message: 'Error al obtener los cines', error: error.message });
    }
};

// Crear nuevo cine
cinemaCtl.crearCine = async (req, res) => {
    try {
        const { 
            nameCinema, addressCinema, phoneCinema, emailCinema,
            latitudeCinema, longitudeCinema, popularCinema,
            // Datos adicionales para MongoDB
            openingHours, services, features, description, gallery
        } = req.body;

        // Validación de campos requeridos
        if (!nameCinema || !addressCinema) {
            return res.status(400).json({ message: 'Nombre y dirección del cine son obligatorios' });
        }

        // Crear en SQL con datos principales
        const nuevoCine = await orm.Cinema.create({
            nameCinema: cifrarDatos(nameCinema),
            addressCinema: cifrarDatos(addressCinema),
            phoneCinema: cifrarDatos(phoneCinema || ''),
            emailCinema: cifrarDatos(emailCinema || ''),
            latitudeCinema: latitudeCinema || 0,
            longitudeCinema: longitudeCinema || 0,
            ratingCinema: 0.0,
            popularCinema: popularCinema || false,
            stateCinema: true,
            createCinema: new Date().toLocaleString(),
        });

        // Crear detalles adicionales en MongoDB
        if (openingHours || services || features || description || gallery) {
            await mongo.cinemaModel.create({
                imageUrl: '',
                openingHours: openingHours || {},
                services: services || [],
                features: features || {},
                socialMedia: {},
                description: description || '',
                gallery: gallery || [],
                idCinemaSql: nuevoCine.idCinema.toString()
            });
        }

        return res.status(201).json({ 
            message: 'Cine creado exitosamente',
            idCinema: nuevoCine.idCinema
        });

    } catch (error) {
        console.error('Error al crear cine:', error);
        return res.status(500).json({ 
            message: 'Error al crear el cine', 
            error: error.message 
        });
    }
};

// ================ GESTIÓN DE SALAS ================

// Obtener salas de un cine específico
cinemaCtl.obtenerSalasCine = async (req, res) => {
    try {
        const { cinemaId } = req.params;

        const [salas] = await sql.promise().query(`
            SELECT r.*, 
                   COUNT(s.idSeat) as totalAsientos,
                   COUNT(CASE WHEN s.stateSeat = 1 THEN 1 END) as asientosActivos
            FROM rooms r
            LEFT JOIN seats s ON r.idRoom = s.roomId
            WHERE r.cinemaId = ? AND r.stateRoom = 1
            GROUP BY r.idRoom
            ORDER BY r.numberRoom ASC
        `, [cinemaId]);

        const salasCompletas = await Promise.all(
            salas.map(async (sala) => {
                // Obtener configuración de MongoDB
                const configuracion = await mongo.roomConfigModel.findOne({
                    idRoomSql: sala.idRoom.toString()
                });

                return {
                    ...sala,
                    nameRoom: descifrarSeguro(sala.nameRoom),
                    totalAsientos: sala.totalAsientos || 0,
                    asientosActivos: sala.asientosActivos || 0,
                    configuracion: configuracion || null
                };
            })
        );

        return res.json(salasCompletas);
    } catch (error) {
        console.error('Error al obtener salas:', error);
        return res.status(500).json({ message: 'Error al obtener salas', error: error.message });
    }
};

// Crear nueva sala
cinemaCtl.crearSala = async (req, res) => {
    try {
        const { cinemaId } = req.params;
        const { 
            nameRoom, numberRoom, typeRoom, totalCapacity, rows, basePrice,
            // Configuración adicional
            seatsPerRow, technology, seatConfiguration, amenities
        } = req.body;

        // Validaciones
        if (!nameRoom || !numberRoom || !totalCapacity) {
            return res.status(400).json({ message: 'Nombre, número y capacidad son obligatorios' });
        }

        // Verificar que el cine existe
        const [cineExiste] = await sql.promise().query(
            'SELECT idCinema FROM cinemas WHERE idCinema = ? AND stateCinema = 1',
            [cinemaId]
        );

        if (cineExiste.length === 0) {
            return res.status(404).json({ message: 'Cine no encontrado' });
        }

        // Crear sala
        const nuevaSala = await orm.Room.create({
            nameRoom: cifrarDatos(nameRoom),
            numberRoom: parseInt(numberRoom),
            typeRoom: typeRoom || 'Regular',
            totalCapacity: parseInt(totalCapacity),
            rows: parseInt(rows) || 1,
            basePrice: parseFloat(basePrice) || 0,
            cinemaId: parseInt(cinemaId),
            stateRoom: true,
            createRoom: new Date().toLocaleString(),
        });

        // Crear configuración en MongoDB
        if (seatsPerRow || technology || seatConfiguration || amenities) {
            await mongo.roomConfigModel.create({
                seatsPerRow: seatsPerRow || [],
                technology: technology || [],
                seatConfiguration: seatConfiguration || {},
                amenities: amenities || {},
                maintenanceSchedule: {},
                idRoomSql: nuevaSala.idRoom.toString()
            });
        }

        return res.status(201).json({ 
            message: 'Sala creada exitosamente',
            idRoom: nuevaSala.idRoom
        });

    } catch (error) {
        console.error('Error al crear sala:', error);
        return res.status(500).json({ 
            message: 'Error al crear la sala', 
            error: error.message 
        });
    }
};

// ================ GESTIÓN DE PELÍCULAS ================

// Mostrar todas las películas activas
cinemaCtl.mostrarPeliculas = async (req, res) => {
    try {
        const [peliculas] = await sql.promise().query(`
            SELECT m.*, 
                   COUNT(DISTINCT f.idFunction) as funcionesActivas,
                   AVG(m.ratingMovie) as promedioRating
            FROM movies m
            LEFT JOIN functions f ON m.idMovie = f.movieId AND f.activeFunction = 1
            WHERE m.stateMovie = 1
            GROUP BY m.idMovie
            ORDER BY m.featuredMovie DESC, m.popularMovie DESC, m.releaseDate DESC
        `);

        const peliculasCompletas = await Promise.all(
            peliculas.map(async (pelicula) => {
                // Obtener metadata de MongoDB
                const metadata = await mongo.movieMetadataModel.findOne({
                    idMovieSql: pelicula.idMovie.toString()
                });

                return {
                    ...pelicula,
                    titleMovie: descifrarSeguro(pelicula.titleMovie),
                    originalTitle: descifrarSeguro(pelicula.originalTitle),
                    synopsis: descifrarSeguro(pelicula.synopsis),
                    funcionesActivas: pelicula.funcionesActivas || 0,
                    metadata: metadata ? {
                        poster: metadata.posterImage,
                        trailer: metadata.trailerUrl,
                        reparto: metadata.cast,
                        director: metadata.director,
                        galeria: metadata.gallery
                    } : null
                };
            })
        );

        return res.json(peliculasCompletas);
    } catch (error) {
        console.error('Error al mostrar películas:', error);
        return res.status(500).json({ message: 'Error al obtener películas', error: error.message });
    }
};

// Crear nueva película
cinemaCtl.crearPelicula = async (req, res) => {
    try {
        const { 
            titleMovie, originalTitle, synopsis, durationMinutes, releaseDate,
            endDate, originalLanguage, distributor, countryOrigin,
            // Metadata adicional
            posterImage, trailerUrl, cast, director, gallery
        } = req.body;

        // Validaciones
        if (!titleMovie || !durationMinutes || !releaseDate) {
            return res.status(400).json({ message: 'Título, duración y fecha de estreno son obligatorios' });
        }

        // Crear película
        const nuevaPelicula = await orm.Movie.create({
            titleMovie: cifrarDatos(titleMovie),
            originalTitle: cifrarDatos(originalTitle || titleMovie),
            synopsis: cifrarDatos(synopsis || ''),
            durationMinutes: parseInt(durationMinutes),
            releaseDate: new Date(releaseDate),
            endDate: endDate ? new Date(endDate) : null,
            originalLanguage: originalLanguage || 'Español',
            distributor: distributor || '',
            countryOrigin: countryOrigin || '',
            ratingMovie: 0.0,
            voteCount: 0,
            popularMovie: false,
            newMovie: true,
            featuredMovie: false,
            stateMovie: true,
            createMovie: new Date().toLocaleString(),
        });

        // Crear metadata en MongoDB
        if (posterImage || trailerUrl || cast || director || gallery) {
            await mongo.movieMetadataModel.create({
                posterImage: posterImage || '',
                backdropImage: '',
                trailerUrl: trailerUrl || '',
                gallery: gallery || [],
                cast: cast || [],
                director: director || {},
                production: {},
                technicalSpecs: {},
                idMovieSql: nuevaPelicula.idMovie.toString()
            });
        }

        return res.status(201).json({ 
            message: 'Película creada exitosamente',
            idMovie: nuevaPelicula.idMovie
        });

    } catch (error) {
        console.error('Error al crear película:', error);
        return res.status(500).json({ 
            message: 'Error al crear la película', 
            error: error.message 
        });
    }
};

// ================ GESTIÓN DE FUNCIONES ================

// Obtener funciones de una película específica
cinemaCtl.obtenerFuncionesPelicula = async (req, res) => {
    try {
        const { movieId } = req.params;

        const [funciones] = await sql.promise().query(`
            SELECT f.*, r.nameRoom, r.numberRoom, c.nameCinema
            FROM functions f
            JOIN rooms r ON f.roomId = r.idRoom
            JOIN cinemas c ON r.cinemaId = c.idCinema
            WHERE f.movieId = ? AND f.activeFunction = 1
            ORDER BY f.dateFunction ASC, f.startTime ASC
        `, [movieId]);

        const funcionesCompletas = funciones.map(funcion => ({
            ...funcion,
            nameRoom: descifrarSeguro(funcion.nameRoom),
            nameCinema: descifrarSeguro(funcion.nameCinema),
            asientosDisponibles: funcion.availableSeats - funcion.reservedSeats - funcion.soldSeats
        }));

        return res.json(funcionesCompletas);
    } catch (error) {
        console.error('Error al obtener funciones:', error);
        return res.status(500).json({ message: 'Error al obtener funciones', error: error.message });
    }
};

// Crear nueva función
cinemaCtl.crearFuncion = async (req, res) => {
    try {
        const { 
            movieId, roomId, dateFunction, startTime, endTime,
            formatFunction, languageFunction, subtitlesFunction,
            basePrice, vipPrice, premiumPrice
        } = req.body;

        // Validaciones
        if (!movieId || !roomId || !dateFunction || !startTime || !basePrice) {
            return res.status(400).json({ message: 'Película, sala, fecha, hora y precio son obligatorios' });
        }

        // Obtener capacidad de la sala
        const [sala] = await sql.promise().query(
            'SELECT totalCapacity FROM rooms WHERE idRoom = ? AND stateRoom = 1',
            [roomId]
        );

        if (sala.length === 0) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        // Crear función
        const nuevaFuncion = await orm.Function.create({
            movieId: parseInt(movieId),
            roomId: parseInt(roomId),
            dateFunction: new Date(dateFunction),
            startTime: startTime,
            endTime: endTime,
            formatFunction: formatFunction || '2D',
            languageFunction: languageFunction || 'Español',
            subtitlesFunction: subtitlesFunction || 'Ninguno',
            basePrice: parseFloat(basePrice),
            vipPrice: parseFloat(vipPrice) || parseFloat(basePrice) * 1.5,
            premiumPrice: parseFloat(premiumPrice) || parseFloat(basePrice) * 2,
            availableSeats: sala[0].totalCapacity,
            reservedSeats: 0,
            soldSeats: 0,
            stateFunction: 'Scheduled',
            activeFunction: true,
            createFunction: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Función creada exitosamente',
            idFunction: nuevaFuncion.idFunction
        });

    } catch (error) {
        console.error('Error al crear función:', error);
        return res.status(500).json({ 
            message: 'Error al crear la función', 
            error: error.message 
        });
    }
};

// ================ GESTIÓN DE RESERVAS ================

// Obtener reservas de un usuario
cinemaCtl.obtenerReservasUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        const [reservas] = await sql.promise().query(`
            SELECT r.*, m.titleMovie, c.nameCinema, f.dateFunction, f.startTime
            FROM reservations r
            JOIN functions f ON r.functionId = f.idFunction
            JOIN movies m ON f.movieId = m.idMovie
            JOIN rooms rm ON f.roomId = rm.idRoom
            JOIN cinemas c ON rm.cinemaId = c.idCinema
            WHERE r.usuarioId = ?
            ORDER BY r.dateReservation DESC
        `, [usuarioId]);

        const reservasCompletas = reservas.map(reserva => ({
            ...reserva,
            titleMovie: descifrarSeguro(reserva.titleMovie),
            nameCinema: descifrarSeguro(reserva.nameCinema)
        }));

        return res.json(reservasCompletas);
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        return res.status(500).json({ message: 'Error al obtener reservas', error: error.message });
    }
};

// Crear nueva reserva
cinemaCtl.crearReserva = async (req, res) => {
    try {
        const { 
            usuarioId, functionId, selectedSeats, paymentMethod,
            subtotalTickets, subtotalProducts, serviceCommission
        } = req.body;

        // Validaciones
        if (!usuarioId || !functionId || !selectedSeats || selectedSeats.length === 0) {
            return res.status(400).json({ message: 'Usuario, función y asientos son obligatorios' });
        }

        // Generar código de reserva único
        const codigoReserva = 'RES-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        // Calcular totales
        const totalReservation = (subtotalTickets || 0) + (subtotalProducts || 0) + (serviceCommission || 0);
        const expirationDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

        // Crear reserva
        const nuevaReserva = await orm.Reservation.create({
            usuarioId: parseInt(usuarioId),
            functionId: parseInt(functionId),
            codeReservation: codigoReserva,
            dateReservation: new Date(),
            expirationDate: expirationDate,
            numberSeats: selectedSeats.length,
            subtotalTickets: parseFloat(subtotalTickets) || 0,
            subtotalProducts: parseFloat(subtotalProducts) || 0,
            serviceCommission: parseFloat(serviceCommission) || 0,
            discounts: 0,
            totalReservation: totalReservation,
            paymentMethod: paymentMethod || 'CreditCard',
            stateReservation: 'Pending',
            originReservation: 'Web',
            createReservation: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Reserva creada exitosamente',
            idReservation: nuevaReserva.idReservation,
            codigoReserva: codigoReserva
        });

    } catch (error) {
        console.error('Error al crear reserva:', error);
        return res.status(500).json({ 
            message: 'Error al crear la reserva', 
            error: error.message 
        });
    }
};

// ================ ESTADÍSTICAS ================

// Obtener estadísticas del módulo de cines
cinemaCtl.obtenerEstadisticas = async (req, res) => {
    try {
        // Estadísticas generales
        const [estadisticas] = await sql.promise().query(`
            SELECT 
                COUNT(DISTINCT c.idCinema) as totalCines,
                COUNT(DISTINCT r.idRoom) as totalSalas,
                COUNT(DISTINCT m.idMovie) as totalPeliculas,
                COUNT(DISTINCT f.idFunction) as totalFunciones,
                COUNT(DISTINCT res.idReservation) as totalReservas,
                SUM(res.totalReservation) as ingresoTotal
            FROM cinemas c
            LEFT JOIN rooms r ON c.idCinema = r.cinemaId AND r.stateRoom = 1
            LEFT JOIN movies m ON m.stateMovie = 1
            LEFT JOIN functions f ON r.idRoom = f.roomId AND f.activeFunction = 1
            LEFT JOIN reservations res ON f.idFunction = res.functionId
            WHERE c.stateCinema = 1
        `);

        // Películas más populares
        const [peliculasPopulares] = await sql.promise().query(`
            SELECT m.titleMovie, COUNT(res.idReservation) as reservas
            FROM movies m
            LEFT JOIN functions f ON m.idMovie = f.movieId
            LEFT JOIN reservations res ON f.idFunction = res.functionId
            WHERE m.stateMovie = 1
            GROUP BY m.idMovie
            ORDER BY reservas DESC
            LIMIT 5
        `);

        return res.json({
            estadisticas: {
                ...estadisticas[0],
                ingresoTotal: estadisticas[0].ingresoTotal || 0
            },
            peliculasPopulares: peliculasPopulares.map(pelicula => ({
                ...pelicula,
                titleMovie: descifrarSeguro(pelicula.titleMovie)
            }))
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

module.exports = cinemaCtl;