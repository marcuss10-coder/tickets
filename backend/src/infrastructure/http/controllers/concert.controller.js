const concertCtl = {};
const orm = require('../../../infrastructure/database/connection/dataBase.orm');
const sql = require('../../../infrastructure/database/connection/dataBase.sql');
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

// ================ GESTIÓN DE ARTISTAS ================

// Mostrar todos los artistas activos
concertCtl.mostrarArtistas = async (req, res) => {
    try {
        const [artistas] = await sql.promise().query(`
            SELECT a.*, 
                   COUNT(DISTINCT c.idConcert) as conciertosProgramados,
                   COUNT(DISTINCT cr.idConcertReservation) as reservasTotales
            FROM artists a
            LEFT JOIN concerts c ON a.idArtist = c.artistId AND c.stateConcert = 1
            LEFT JOIN concertReservations cr ON c.idConcert = cr.concertId
            WHERE a.stateArtist = 1
            GROUP BY a.idArtist
            ORDER BY a.statusArtist DESC, a.createArtist DESC
        `);

        const artistasCompletos = artistas.map(artista => ({
            ...artista,
            nameArtist: descifrarSeguro(artista.nameArtist),
            genreArtist: descifrarSeguro(artista.genreArtist),
            countryOrigin: descifrarSeguro(artista.countryOrigin),
            biography: descifrarSeguro(artista.biography),
            conciertosProgramados: artista.conciertosProgramados || 0,
            reservasTotales: artista.reservasTotales || 0
        }));

        return res.json(artistasCompletos);
    } catch (error) {
        console.error('Error al mostrar artistas:', error);
        return res.status(500).json({ message: 'Error al obtener artistas', error: error.message });
    }
};

// Crear nuevo artista
concertCtl.crearArtista = async (req, res) => {
    try {
        const { 
            nameArtist, genreArtist, countryOrigin, biography,
            socialMediaLinks, contactInfo, statusArtist
        } = req.body;

        // Validaciones
        if (!nameArtist || !genreArtist) {
            return res.status(400).json({ message: 'Nombre y género del artista son obligatorios' });
        }

        // Crear artista
        const nuevoArtista = await orm.Artist.create({
            nameArtist: cifrarDatos(nameArtist),
            genreArtist: cifrarDatos(genreArtist),
            countryOrigin: cifrarDatos(countryOrigin || ''),
            biography: cifrarDatos(biography || ''),
            socialMediaLinks: socialMediaLinks || '',
            contactInfo: contactInfo || '',
            statusArtist: statusArtist || 'active',
            stateArtist: true,
            createArtist: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Artista creado exitosamente',
            idArtist: nuevoArtista.idArtist
        });

    } catch (error) {
        console.error('Error al crear artista:', error);
        return res.status(500).json({ 
            message: 'Error al crear el artista', 
            error: error.message 
        });
    }
};

// ================ GESTIÓN DE VENUES ================

// Mostrar todos los venues activos
concertCtl.mostrarVenues = async (req, res) => {
    try {
        const [venues] = await sql.promise().query(`
            SELECT v.*, 
                   COUNT(DISTINCT c.idConcert) as conciertosProgramados,
                   COUNT(DISTINCT cs.idConcertSection) as secciones
            FROM concertVenues v
            LEFT JOIN concerts c ON v.idConcertVenue = c.venueId AND c.stateConcert = 1
            LEFT JOIN concertSections cs ON v.idConcertVenue = cs.venueId AND cs.stateConcertSection = 1
            WHERE v.stateVenue = 1
            GROUP BY v.idConcertVenue
            ORDER BY v.capacity DESC, v.createVenue DESC
        `);

        const venuesCompletos = venues.map(venue => ({
            ...venue,
            nameVenue: descifrarSeguro(venue.nameVenue),
            addressVenue: descifrarSeguro(venue.addressVenue),
            contactInfo: descifrarSeguro(venue.contactInfo),
            conciertosProgramados: venue.conciertosProgramados || 0,
            secciones: venue.secciones || 0
        }));

        return res.json(venuesCompletos);
    } catch (error) {
        console.error('Error al mostrar venues:', error);
        return res.status(500).json({ message: 'Error al obtener venues', error: error.message });
    }
};

// Crear nuevo venue
concertCtl.crearVenue = async (req, res) => {
    try {
        const { 
            nameVenue, addressVenue, capacity, venueType,
            soundSystem, lightingSystem, stageSize, parkingSpaces,
            accessibilityFeatures, contactInfo
        } = req.body;

        // Validaciones
        if (!nameVenue || !addressVenue || !capacity || !venueType) {
            return res.status(400).json({ message: 'Nombre, dirección, capacidad y tipo de venue son obligatorios' });
        }

        // Crear venue
        const nuevoVenue = await orm.ConcertVenue.create({
            nameVenue: cifrarDatos(nameVenue),
            addressVenue: cifrarDatos(addressVenue),
            capacity: parseInt(capacity),
            venueType: venueType,
            soundSystem: soundSystem || '',
            lightingSystem: lightingSystem || '',
            stageSize: stageSize || '',
            parkingSpaces: parseInt(parkingSpaces) || 0,
            accessibilityFeatures: accessibilityFeatures || '',
            contactInfo: cifrarDatos(contactInfo || ''),
            stateVenue: true,
            createVenue: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Venue creado exitosamente',
            idVenue: nuevoVenue.idConcertVenue
        });

    } catch (error) {
        console.error('Error al crear venue:', error);
        return res.status(500).json({ 
            message: 'Error al crear el venue', 
            error: error.message 
        });
    }
};

// ================ GESTIÓN DE SECCIONES ================

// Obtener secciones de un venue
concertCtl.obtenerSeccionesVenue = async (req, res) => {
    try {
        const { venueId } = req.params;

        const [secciones] = await sql.promise().query(`
            SELECT cs.*, 
                   COUNT(cst.idConcertSeat) as totalAsientos,
                   COUNT(CASE WHEN cst.stateConcertSeat = 1 THEN 1 END) as asientosActivos
            FROM concertSections cs
            LEFT JOIN concertSeats cst ON cs.idConcertSection = cst.sectionId
            WHERE cs.venueId = ? AND cs.stateConcertSection = 1
            GROUP BY cs.idConcertSection
            ORDER BY cs.basePrice ASC
        `, [venueId]);

        const seccionesCompletas = secciones.map(seccion => ({
            ...seccion,
            sectionName: descifrarSeguro(seccion.sectionName),
            amenities: descifrarSeguro(seccion.amenities),
            totalAsientos: seccion.totalAsientos || 0,
            asientosActivos: seccion.asientosActivos || 0
        }));

        return res.json(seccionesCompletas);
    } catch (error) {
        console.error('Error al obtener secciones:', error);
        return res.status(500).json({ message: 'Error al obtener secciones', error: error.message });
    }
};

// Crear nueva sección
concertCtl.crearSeccion = async (req, res) => {
    try {
        const { venueId } = req.params;
        const { 
            sectionName, capacity, basePrice, sectionType,
            viewQuality, amenities
        } = req.body;

        // Validaciones
        if (!sectionName || !capacity || !basePrice) {
            return res.status(400).json({ message: 'Nombre, capacidad y precio base son obligatorios' });
        }

        // Verificar que el venue existe
        const [venueExiste] = await sql.promise().query(
            'SELECT idConcertVenue FROM concertVenues WHERE idConcertVenue = ? AND stateVenue = 1',
            [venueId]
        );

        if (venueExiste.length === 0) {
            return res.status(404).json({ message: 'Venue no encontrado' });
        }

        // Crear sección
        const nuevaSeccion = await orm.ConcertSection.create({
            sectionName: cifrarDatos(sectionName),
            capacity: parseInt(capacity),
            basePrice: parseFloat(basePrice),
            sectionType: sectionType || 'seated',
            viewQuality: viewQuality || 'good',
            amenities: cifrarDatos(amenities || ''),
            venueId: parseInt(venueId),
            stateConcertSection: true,
            createConcertSection: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Sección creada exitosamente',
            idSection: nuevaSeccion.idConcertSection
        });

    } catch (error) {
        console.error('Error al crear sección:', error);
        return res.status(500).json({ 
            message: 'Error al crear la sección', 
            error: error.message 
        });
    }
};

// ================ GESTIÓN DE CONCIERTOS ================

// Mostrar todos los conciertos
concertCtl.mostrarConciertos = async (req, res) => {
    try {
        const [conciertos] = await sql.promise().query(`
            SELECT c.*, a.nameArtist, v.nameVenue, v.addressVenue,
                   COUNT(DISTINCT cr.idConcertReservation) as reservasTotales,
                   SUM(cr.pricePaid) as ingresoTotal
            FROM concerts c
            JOIN artists a ON c.artistId = a.idArtist
            JOIN concertVenues v ON c.venueId = v.idConcertVenue
            LEFT JOIN concertReservations cr ON c.idConcert = cr.concertId
            WHERE c.stateConcert = 1
            GROUP BY c.idConcert
            ORDER BY c.dateConcert DESC
        `);

        const conciertosCompletos = await Promise.all(
            conciertos.map(async (concierto) => {
                // Obtener metadata de MongoDB
                const metadata = await mongo.concertModel.findOne({
                    idConcertSql: concierto.idConcert.toString()
                });

                return {
                    ...concierto,
                    nameConcert: descifrarSeguro(concierto.nameConcert),
                    tourName: descifrarSeguro(concierto.tourName),
                    descriptionConcert: descifrarSeguro(concierto.descriptionConcert),
                    nameArtist: descifrarSeguro(concierto.nameArtist),
                    nameVenue: descifrarSeguro(concierto.nameVenue),
                    addressVenue: descifrarSeguro(concierto.addressVenue),
                    reservasTotales: concierto.reservasTotales || 0,
                    ingresoTotal: concierto.ingresoTotal || 0,
                    metadata: metadata ? {
                        setlist: metadata.setlist,
                        miembros: metadata.bandMembers,
                        merchandising: metadata.merchandising
                    } : null
                };
            })
        );

        return res.json(conciertosCompletos);
    } catch (error) {
        console.error('Error al mostrar conciertos:', error);
        return res.status(500).json({ message: 'Error al obtener conciertos', error: error.message });
    }
};

// Crear nuevo concierto
concertCtl.crearConcierto = async (req, res) => {
    try {
        const { 
            nameConcert, tourName, descriptionConcert, artistId, venueId,
            dateConcert, startTime, endTime, ageRestriction, durationMinutes,
            ticketPrice, vipPrice, statusConcert,
            // Metadata adicional
            setlist, bandMembers, merchandising
        } = req.body;

        // Validaciones
        if (!nameConcert || !artistId || !venueId || !dateConcert || !startTime || !ticketPrice) {
            return res.status(400).json({ message: 'Nombre, artista, venue, fecha, hora y precio son obligatorios' });
        }

        // Verificar que el artista y venue existen
        const [artistaExiste] = await sql.promise().query(
            'SELECT idArtist FROM artists WHERE idArtist = ? AND stateArtist = 1',
            [artistId]
        );

        const [venueExiste] = await sql.promise().query(
            'SELECT idConcertVenue FROM concertVenues WHERE idConcertVenue = ? AND stateVenue = 1',
            [venueId]
        );

        if (artistaExiste.length === 0) {
            return res.status(404).json({ message: 'Artista no encontrado' });
        }

        if (venueExiste.length === 0) {
            return res.status(404).json({ message: 'Venue no encontrado' });
        }

        // Crear concierto
        const nuevoConcierto = await orm.Concert.create({
            nameConcert: cifrarDatos(nameConcert),
            tourName: cifrarDatos(tourName || ''),
            descriptionConcert: cifrarDatos(descriptionConcert || ''),
            artistId: parseInt(artistId),
            venueId: parseInt(venueId),
            dateConcert: new Date(dateConcert),
            startTime: startTime,
            endTime: endTime,
            ageRestriction: parseInt(ageRestriction) || 0,
            durationMinutes: parseInt(durationMinutes) || 120,
            ticketPrice: parseFloat(ticketPrice),
            vipPrice: parseFloat(vipPrice) || parseFloat(ticketPrice) * 2,
            statusConcert: statusConcert || 'scheduled',
            stateConcert: true,
            createConcert: new Date().toLocaleString(),
        });

        // Crear metadata en MongoDB
        if (setlist || bandMembers || merchandising) {
            await mongo.concertModel.create({
                setlist: setlist || [],
                bandMembers: bandMembers || [],
                merchandising: merchandising || [],
                technicalRequirements: {},
                socialMedia: {},
                historicalData: {},
                idConcertSql: nuevoConcierto.idConcert.toString()
            });
        }

        return res.status(201).json({ 
            message: 'Concierto creado exitosamente',
            idConcert: nuevoConcierto.idConcert
        });

    } catch (error) {
        console.error('Error al crear concierto:', error);
        return res.status(500).json({ 
            message: 'Error al crear el concierto', 
            error: error.message 
        });
    }
};

// ================ GESTIÓN DE RESERVAS DE CONCIERTOS ================

// Obtener reservas de un concierto
concertCtl.obtenerReservasConcierto = async (req, res) => {
    try {
        const { concertId } = req.params;

        const [reservas] = await sql.promise().query(`
            SELECT cr.*, u.nameUsers, u.emailUser,
                   cs.sectionName, cst.rowIdentifier, cst.seatNumber
            FROM concertReservations cr
            JOIN users u ON cr.usuarioId = u.idUser
            LEFT JOIN concertSeats cst ON cr.seatId = cst.idConcertSeat
            LEFT JOIN concertSections cs ON cst.sectionId = cs.idConcertSection
            WHERE cr.concertId = ?
            ORDER BY cr.createConcertReservation DESC
        `, [concertId]);

        const reservasCompletas = reservas.map(reserva => ({
            ...reserva,
            nameUsers: descifrarSeguro(reserva.nameUsers),
            emailUser: descifrarSeguro(reserva.emailUser),
            sectionName: descifrarSeguro(reserva.sectionName),
            rowIdentifier: descifrarSeguro(reserva.rowIdentifier)
        }));

        return res.json(reservasCompletas);
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        return res.status(500).json({ message: 'Error al obtener reservas', error: error.message });
    }
};

// Crear nueva reserva de concierto
concertCtl.crearReservaConcierto = async (req, res) => {
    try {
        const { 
            usuarioId, concertId, seatId, ticketType, pricePaid,
            specialRequests, accessibilityNeeds
        } = req.body;

        // Validaciones
        if (!usuarioId || !concertId || !pricePaid) {
            return res.status(400).json({ message: 'Usuario, concierto y precio son obligatorios' });
        }

        // Generar código de reserva único
        const reservationCode = 'CON-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        // Crear reserva
        const nuevaReserva = await orm.ConcertReservation.create({
            usuarioId: parseInt(usuarioId),
            concertId: parseInt(concertId),
            seatId: seatId ? parseInt(seatId) : null,
            reservationCode: reservationCode,
            ticketType: ticketType || 'Regular',
            pricePaid: parseFloat(pricePaid),
            statusReservation: 'reserved',
            specialRequests: specialRequests || '',
            accessibilityNeeds: accessibilityNeeds || '',
            purchaseDate: new Date(),
            createConcertReservation: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Reserva de concierto creada exitosamente',
            idReservation: nuevaReserva.idConcertReservation,
            reservationCode: reservationCode
        });

    } catch (error) {
        console.error('Error al crear reserva:', error);
        return res.status(500).json({ 
            message: 'Error al crear la reserva', 
            error: error.message 
        });
    }
};

// ================ GESTIÓN DE ASIENTOS ================

// Obtener asientos de una sección
concertCtl.obtenerAsientosSeccion = async (req, res) => {
    try {
        const { sectionId } = req.params;

        const [asientos] = await sql.promise().query(`
            SELECT cst.*, 
                   CASE WHEN cr.idConcertReservation IS NOT NULL THEN 'ocupado' ELSE 'disponible' END as estado
            FROM concertSeats cst
            LEFT JOIN concertReservations cr ON cst.idConcertSeat = cr.seatId 
                AND cr.statusReservation IN ('reserved', 'confirmed')
            WHERE cst.sectionId = ? AND cst.stateConcertSeat = 1
            ORDER BY cst.rowIdentifier ASC, cst.seatNumber ASC
        `, [sectionId]);

        const asientosCompletos = asientos.map(asiento => ({
            ...asiento,
            rowIdentifier: descifrarSeguro(asiento.rowIdentifier)
        }));

        return res.json(asientosCompletos);
    } catch (error) {
        console.error('Error al obtener asientos:', error);
        return res.status(500).json({ message: 'Error al obtener asientos', error: error.message });
    }
};

// Crear asientos para una sección
concertCtl.crearAsientosSeccion = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { rows, seatsPerRow, seatType } = req.body;

        // Validaciones
        if (!rows || !seatsPerRow || rows.length === 0) {
            return res.status(400).json({ message: 'Configuración de filas y asientos es obligatoria' });
        }

        // Verificar que la sección existe
        const [seccionExiste] = await sql.promise().query(
            'SELECT idConcertSection FROM concertSections WHERE idConcertSection = ? AND stateConcertSection = 1',
            [sectionId]
        );

        if (seccionExiste.length === 0) {
            return res.status(404).json({ message: 'Sección no encontrada' });
        }

        const asientosCreados = [];

        // Crear asientos por fila
        for (let i = 0; i < rows.length; i++) {
            const rowLabel = rows[i];
            const seatsInRow = seatsPerRow[i] || seatsPerRow[0];

            for (let seatNum = 1; seatNum <= seatsInRow; seatNum++) {
                const nuevoAsiento = await orm.ConcertSeat.create({
                    sectionId: parseInt(sectionId),
                    rowIdentifier: cifrarDatos(rowLabel),
                    seatNumber: seatNum,
                    seatType: seatType || 'regular',
                    positionX: seatNum,
                    positionY: i + 1,
                    viewLine: 'clear',
                    stateConcertSeat: true,
                    createConcertSeat: new Date().toLocaleString(),
                });

                asientosCreados.push(nuevoAsiento.idConcertSeat);
            }
        }

        return res.status(201).json({ 
            message: 'Asientos creados exitosamente',
            totalAsientos: asientosCreados.length,
            asientosCreados: asientosCreados
        });

    } catch (error) {
        console.error('Error al crear asientos:', error);
        return res.status(500).json({ 
            message: 'Error al crear los asientos', 
            error: error.message 
        });
    }
};

// ================ ESTADÍSTICAS ================

// Obtener estadísticas del módulo de conciertos
concertCtl.obtenerEstadisticas = async (req, res) => {
    try {
        // Estadísticas generales
        const [estadisticas] = await sql.promise().query(`
            SELECT 
                COUNT(DISTINCT a.idArtist) as totalArtistas,
                COUNT(DISTINCT v.idConcertVenue) as totalVenues,
                COUNT(DISTINCT c.idConcert) as totalConciertos,
                COUNT(DISTINCT cr.idConcertReservation) as totalReservas,
                SUM(cr.pricePaid) as ingresoTotal,
                AVG(cr.pricePaid) as precioPromedio
            FROM artists a
            LEFT JOIN concerts c ON a.idArtist = c.artistId AND c.stateConcert = 1
            LEFT JOIN concertVenues v ON c.venueId = v.idConcertVenue AND v.stateVenue = 1
            LEFT JOIN concertReservations cr ON c.idConcert = cr.concertId
            WHERE a.stateArtist = 1
        `);

        // Artistas más populares
        const [artistasPopulares] = await sql.promise().query(`
            SELECT a.nameArtist, COUNT(cr.idConcertReservation) as reservas
            FROM artists a
            LEFT JOIN concerts c ON a.idArtist = c.artistId
            LEFT JOIN concertReservations cr ON c.idConcert = cr.concertId
            WHERE a.stateArtist = 1
            GROUP BY a.idArtist
            ORDER BY reservas DESC
            LIMIT 5
        `);

        // Venues más utilizados
        const [venuesPopulares] = await sql.promise().query(`
            SELECT v.nameVenue, COUNT(c.idConcert) as conciertos
            FROM concertVenues v
            LEFT JOIN concerts c ON v.idConcertVenue = c.venueId
            WHERE v.stateVenue = 1
            GROUP BY v.idConcertVenue
            ORDER BY conciertos DESC
            LIMIT 5
        `);

        return res.json({
            estadisticas: {
                ...estadisticas[0],
                ingresoTotal: estadisticas[0].ingresoTotal || 0,
                precioPromedio: estadisticas[0].precioPromedio || 0
            },
            artistasPopulares: artistasPopulares.map(artista => ({
                ...artista,
                nameArtist: descifrarSeguro(artista.nameArtist)
            })),
            venuesPopulares: venuesPopulares.map(venue => ({
                ...venue,
                nameVenue: descifrarSeguro(venue.nameVenue)
            }))
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// ================ FUNCIONES AUXILIARES ================

// Actualizar estado de artista
concertCtl.actualizarEstadoArtista = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusArtist } = req.body;

        if (!statusArtist || !['active', 'inactive', 'on_tour'].includes(statusArtist)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }

        await sql.promise().query(
            'UPDATE artists SET statusArtist = ?, updateArtist = ? WHERE idArtist = ?',
            [statusArtist, new Date().toLocaleString(), id]
        );

        return res.json({ message: 'Estado del artista actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        return res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
    }
};

// Cancelar reserva de concierto
concertCtl.cancelarReservaConcierto = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        await sql.promise().query(
            'UPDATE concertReservations SET statusReservation = ?, updateConcertReservation = ? WHERE idConcertReservation = ?',
            ['cancelled', new Date().toLocaleString(), id]
        );

        return res.json({ message: 'Reserva cancelada exitosamente' });
    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        return res.status(500).json({ message: 'Error al cancelar reserva', error: error.message });
    }
};

module.exports = concertCtl;