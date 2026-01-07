const eventsCtl = {};
const orm = require('../../../infrastructure/database/connection/dataBase.orm');
const sql = require('../../../infrastructure/database/connection/dataBase.sql');
const mongo = require('../../../infrastructure/database/connection/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../../../application/encrypDates');
const EventSettings = require('../../../infrastructure/database/mongo/eventSettings');

// Función para descifrar de forma segura
const descifrarSeguro = (dato) => {
    try {
        return dato ? descifrarDatos(dato) : '';
    } catch (error) {
        console.error('Error al descifrar:', error);
        return '';
    }
};

// ================ GESTIÓN DE EVENTOS GENERALES ================

// Mostrar todos los eventos (Cinema, Concert, Transport)
eventsCtl.mostrarEventos = async (req, res) => {
    try {
        const [eventos] = await sql.promise().query(`
            SELECT e.*, COUNT(t.idTicket) as ticketsVendidos
            FROM events e
            LEFT JOIN tickets t ON e.idEvent = t.eventId
            WHERE e.stateEvent = 1
            GROUP BY e.idEvent
            ORDER BY e.dateTimeEvent DESC
        `);

        const eventosCompletos = await Promise.all(
            eventos.map(async (evento) => {
                let detallesEspecificos = null;

                // Obtener detalles específicos según el tipo de evento
                if (evento.eventType === 'cinema') {
                    const [pelicula] = await sql.promise().query(`
                        SELECT m.titleMovie, f.dateFunction, f.startTime, c.nameCinema, r.nameRoom
                        FROM movies m
                        JOIN functions f ON m.idMovie = f.movieId
                        JOIN rooms r ON f.roomId = r.idRoom
                        JOIN cinemas c ON r.cinemaId = c.idCinema
                        WHERE f.idFunction = ?
                    `, [evento.microserviceEventId]);

                    detallesEspecificos = pelicula.length > 0 ? {
                        titulo: descifrarSeguro(pelicula[0].titleMovie),
                        fecha: pelicula[0].dateFunction,
                        hora: pelicula[0].startTime,
                        cine: descifrarSeguro(pelicula[0].nameCinema),
                        sala: descifrarSeguro(pelicula[0].nameRoom)
                    } : null;

                } else if (evento.eventType === 'concert') {
                    const [concierto] = await sql.promise().query(`
                        SELECT c.nameConcert, c.dateConcert, c.startTime, a.nameArtist, v.nameVenue
                        FROM concerts c
                        JOIN artists a ON c.artistId = a.idArtist
                        JOIN concertVenues v ON c.venueId = v.idConcertVenue
                        WHERE c.idConcert = ?
                    `, [evento.microserviceEventId]);

                    detallesEspecificos = concierto.length > 0 ? {
                        titulo: descifrarSeguro(concierto[0].nameConcert),
                        fecha: concierto[0].dateConcert,
                        hora: concierto[0].startTime,
                        artista: descifrarSeguro(concierto[0].nameArtist),
                        venue: descifrarSeguro(concierto[0].nameVenue)
                    } : null;

                } else if (evento.eventType === 'transport') {
                    const [transporte] = await sql.promise().query(`
                        SELECT tr.routeName, tr.origin, tr.destination, ts.departureTime, ts.arrivalTime, tc.nameCompany
                        FROM transportSchedules ts
                        JOIN transportVehicles tv ON ts.vehicleId = tv.idTransportVehicle
                        JOIN transportRoutes tr ON tv.routeId = tr.idTransportRoute
                        JOIN transportCompanies tc ON tr.companyId = tc.idTransportCompany
                        WHERE ts.idTransportSchedule = ?
                    `, [evento.microserviceEventId]);

                    detallesEspecificos = transporte.length > 0 ? {
                        ruta: descifrarSeguro(transporte[0].routeName),
                        origen: descifrarSeguro(transporte[0].origin),
                        destino: descifrarSeguro(transporte[0].destination),
                        salida: transporte[0].departureTime,
                        llegada: transporte[0].arrivalTime,
                        empresa: descifrarSeguro(transporte[0].nameCompany)
                    } : null;
                }

                return {
                    ...evento,
                    nameEvent: descifrarSeguro(evento.nameEvent),
                    descriptionEvent: descifrarSeguro(evento.descriptionEvent),
                    venue: descifrarSeguro(evento.venue),
                    ticketsVendidos: evento.ticketsVendidos || 0,
                    detallesEspecificos: detallesEspecificos
                };
            })
        );

        return res.json(eventosCompletos);
    } catch (error) {
        console.error('Error al mostrar eventos:', error);
        return res.status(500).json({ message: 'Error al obtener eventos', error: error.message });
    }
};

// Crear nuevo evento general

eventsCtl.crearEvento = async (req, res) => {
    try {
        const {
            nameEvent, descriptionEvent, eventType, microserviceEventId,
            venue, dateTimeEvent, capacity, imageUrl, createdBy
        } = req.body;

        // Validaciones
        if (!nameEvent || !eventType || !microserviceEventId || !dateTimeEvent) {
            return res.status(400).json({ message: 'Nombre, tipo, ID de microservicio y fecha son obligatorios' });
        }

        if (!['cinema', 'concert', 'transport'].includes(eventType)) {
            return res.status(400).json({ message: 'Tipo de evento inválido' });
        }

        const rawDateTime = decodeURIComponent(dateTimeEvent);
        const dateTime = new Date(rawDateTime);
        // Validar fecha y hora
        if (isNaN(dateTime.getTime())) {
            return res.status(400).json({ message: 'Fecha y hora no válidas' });
        }


        if (isNaN(dateTime.getTime())) {
            return res.status(400).json({ message: 'Fecha y hora no válidas' });
        }


        // Crear evento maestro
        const nuevoEvento = await orm.Event.create({
            nameEvent: cifrarDatos(nameEvent),
            descriptionEvent: cifrarDatos(descriptionEvent || ''),
            eventType: eventType,
            microserviceEventId: microserviceEventId.toString(),
            venue: cifrarDatos(venue || ''),
            dateTimeEvent: dateTime, // Usar la fecha validada
            capacity: parseInt(capacity) || 0,
            statusEvent: 'published',
            imageUrl: imageUrl || '',
            createdBy: createdBy || null,
            stateEvent: true,
            createEvent: new Date().toLocaleString(),
        });

              // 🔹 Crear configuración del evento en MongoDB
await EventSettings.create({
    eventIdMysql: nuevoEvento.idEvent,
    eventType: eventType,

    generalSettings: {
        maxReservationsPerUser: 5,
        reservationExpirationMinutes: 30
    },

    pricingSettings: {
        taxConfiguration: {
            taxRate: 0.12,
            taxIncluded: true
        }
    },

    notificationSettings: {
        reminderTimes: [24, 2],
        smsEnabled: false,
        pushNotificationsEnabled: true
    }
});


        return res.status(201).json({
            message: 'Evento creado exitosamente',
            idEvent: nuevoEvento.idEvent
        });

    } catch (error) {
        console.error('Error al crear evento:', error);
        return res.status(500).json({
            message: 'Error al crear el evento',
            error: error.message
        });
    }
};


// ================ GESTIÓN DE TICKETS UNIFICADOS ================

// Mostrar tickets de un usuario
eventsCtl.mostrarTicketsUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        const [tickets] = await sql.promise().query(`
            SELECT t.*, e.nameEvent, e.eventType, e.venue, e.dateTimeEvent, e.imageUrl
            FROM tickets t
            JOIN events e ON t.eventId = e.idEvent
            WHERE t.usuarioId = ?
            ORDER BY t.createTicket DESC
        `, [usuarioId]);

        const ticketsCompletos = await Promise.all(
            tickets.map(async (ticket) => {
                let detallesEspecificos = null;

                // Obtener detalles específicos según el tipo de evento
                if (ticket.eventType === 'cinema') {
                    const [reserva] = await sql.promise().query(`
                        SELECT r.codeReservation, r.numberSeats, f.dateFunction, f.startTime, m.titleMovie
                        FROM reservations r
                        JOIN functions f ON r.functionId = f.idFunction
                        JOIN movies m ON f.movieId = m.idMovie
                        WHERE r.idReservation = ?
                    `, [ticket.microserviceTicketId]);

                    detallesEspecificos = reserva.length > 0 ? {
                        codigoReserva: reserva[0].codeReservation,
                        asientos: reserva[0].numberSeats,
                        pelicula: descifrarSeguro(reserva[0].titleMovie)
                    } : null;

                } else if (ticket.eventType === 'concert') {
                    const [reserva] = await sql.promise().query(`
                        SELECT cr.reservationCode, cr.ticketType, c.nameConcert, a.nameArtist
                        FROM concertReservations cr
                        JOIN concerts c ON cr.concertId = c.idConcert
                        JOIN artists a ON c.artistId = a.idArtist
                        WHERE cr.idConcertReservation = ?
                    `, [ticket.microserviceTicketId]);

                    detallesEspecificos = reserva.length > 0 ? {
                        codigoReserva: reserva[0].reservationCode,
                        tipoTicket: reserva[0].ticketType,
                        concierto: descifrarSeguro(reserva[0].nameConcert),
                        artista: descifrarSeguro(reserva[0].nameArtist)
                    } : null;

                } else if (ticket.eventType === 'transport') {
                    const [reserva] = await sql.promise().query(`
                        SELECT tr.reservationCode, tr.passengerName, tr.bookingClass, rt.routeName
                        FROM transportReservations tr
                        JOIN transportSchedules ts ON tr.scheduleId = ts.idTransportSchedule
                        JOIN transportVehicles tv ON ts.vehicleId = tv.idTransportVehicle
                        JOIN transportRoutes rt ON tv.routeId = rt.idTransportRoute
                        WHERE tr.idTransportReservation = ?
                    `, [ticket.microserviceTicketId]);

                    detallesEspecificos = reserva.length > 0 ? {
                        codigoReserva: reserva[0].reservationCode,
                        pasajero: descifrarSeguro(reserva[0].passengerName),
                        clase: reserva[0].bookingClass,
                        ruta: descifrarSeguro(reserva[0].routeName)
                    } : null;
                }

                return {
                    ...ticket,
                    nameEvent: descifrarSeguro(ticket.nameEvent),
                    venue: descifrarSeguro(ticket.venue),
                    detallesEspecificos: detallesEspecificos
                };
            })
        );

        return res.json(ticketsCompletos);
    } catch (error) {
        console.error('Error al mostrar tickets:', error);
        return res.status(500).json({ message: 'Error al obtener tickets', error: error.message });
    }
};

// Crear ticket unificado
eventsCtl.crearTicket = async (req, res) => {
    try {
        const {
            eventId, usuarioId, microserviceTicketId, ticketType,
            priceTicket, statusTicket
        } = req.body;

        // Validaciones
        if (!eventId || !usuarioId || !microserviceTicketId || !priceTicket) {
            return res.status(400).json({ message: 'Evento, usuario, ID de microservicio y precio son obligatorios' });
        }

        // Generar código de ticket único
        const ticketCode = 'TKT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        // Generar código QR (simulado)
        const qrCode = `QR-${ticketCode}-${eventId}-${usuarioId}`;

        // Crear ticket
        const nuevoTicket = await orm.Ticket.create({
            eventId: parseInt(eventId),
            usuarioId: parseInt(usuarioId),
            ticketCode: ticketCode,
            microserviceTicketId: microserviceTicketId.toString(),
            ticketType: ticketType || 'Regular',
            priceTicket: parseFloat(priceTicket),
            statusTicket: statusTicket || 'reserved',
            purchaseDate: new Date(),
            qrCode: qrCode,
            createTicket: new Date().toLocaleString(),
        });

        return res.status(201).json({
            message: 'Ticket creado exitosamente',
            idTicket: nuevoTicket.idTicket,
            ticketCode: ticketCode,
            qrCode: qrCode
        });

    } catch (error) {
        console.error('Error al crear ticket:', error);
        return res.status(500).json({
            message: 'Error al crear el ticket',
            error: error.message
        });
    }
};

// ================ DASHBOARD Y ESTADÍSTICAS GENERALES ================

// Obtener estadísticas generales del sistema
eventsCtl.obtenerDashboard = async (req, res) => {
    try {
        // Estadísticas generales
        const [estadisticasGenerales] = await sql.promise().query(`
            SELECT 
                COUNT(DISTINCT e.idEvent) as totalEventos,
                COUNT(DISTINCT t.idTicket) as totalTickets,
                COUNT(DISTINCT u.idUser) as totalUsuarios,
                SUM(t.priceTicket) as ingresoTotal,
                AVG(t.priceTicket) as precioPromedio
            FROM events e
            LEFT JOIN tickets t ON e.idEvent = t.eventId
            LEFT JOIN users u ON t.usuarioId = u.idUser
            WHERE e.stateEvent = 1
        `);

        // Estadísticas por tipo de evento
        const [estadisticasPorTipo] = await sql.promise().query(`
            SELECT 
                e.eventType,
                COUNT(DISTINCT e.idEvent) as totalEventos,
                COUNT(DISTINCT t.idTicket) as totalTickets,
                SUM(t.priceTicket) as ingresoTotal
            FROM events e
            LEFT JOIN tickets t ON e.idEvent = t.eventId
            WHERE e.stateEvent = 1
            GROUP BY e.eventType
        `);

        // Eventos más populares
        const [eventosPopulares] = await sql.promise().query(`
            SELECT e.nameEvent, e.eventType, COUNT(t.idTicket) as tickets
            FROM events e
            LEFT JOIN tickets t ON e.idEvent = t.eventId
            WHERE e.stateEvent = 1
            GROUP BY e.idEvent
            ORDER BY tickets DESC
            LIMIT 10
        `);

        // Ventas por mes (últimos 6 meses)
        const [ventasPorMes] = await sql.promise().query(`
            SELECT 
                DATE_FORMAT(t.purchaseDate, '%Y-%m') as mes,
                COUNT(t.idTicket) as tickets,
                SUM(t.priceTicket) as ingresos
            FROM tickets t
            WHERE t.purchaseDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY mes
            ORDER BY mes DESC
        `);

        // Estadísticas específicas por módulo
        const [estadisticasCines] = await sql.promise().query(`
            SELECT 
                COUNT(DISTINCT c.idCinema) as totalCines,
                COUNT(DISTINCT r.idRoom) as totalSalas,
                COUNT(DISTINCT m.idMovie) as totalPeliculas,
                COUNT(DISTINCT f.idFunction) as totalFunciones
            FROM cinemas c
            LEFT JOIN rooms r ON c.idCinema = r.cinemaId AND r.stateRoom = 1
            LEFT JOIN movies m ON m.stateMovie = 1
            LEFT JOIN functions f ON r.idRoom = f.roomId AND f.activeFunction = 1
            WHERE c.stateCinema = 1
        `);

        const [estadisticasConciertos] = await sql.promise().query(`
            SELECT 
                COUNT(DISTINCT a.idArtist) as totalArtistas,
                COUNT(DISTINCT v.idConcertVenue) as totalVenues,
                COUNT(DISTINCT c.idConcert) as totalConciertos
            FROM artists a
            LEFT JOIN concerts c ON a.idArtist = c.artistId AND c.stateConcert = 1
            LEFT JOIN concertVenues v ON c.venueId = v.idConcertVenue AND v.stateVenue = 1
            WHERE a.stateArtist = 1
        `);

        const [estadisticasTransporte] = await sql.promise().query(`
            SELECT 
                COUNT(DISTINCT tc.idTransportCompany) as totalEmpresas,
                COUNT(DISTINCT tr.idTransportRoute) as totalRutas,
                COUNT(DISTINCT tv.idTransportVehicle) as totalVehiculos
            FROM transportCompanies tc
            LEFT JOIN transportRoutes tr ON tc.idTransportCompany = tr.companyId AND tr.stateRoute = 1
            LEFT JOIN transportVehicles tv ON tr.idTransportRoute = tv.routeId AND tv.stateVehicle = 1
            WHERE tc.stateCompany = 1
        `);

        return res.json({
            resumen: {
                ...estadisticasGenerales[0],
                ingresoTotal: estadisticasGenerales[0].ingresoTotal || 0,
                precioPromedio: estadisticasGenerales[0].precioPromedio || 0
            },
            porTipo: estadisticasPorTipo.map(stat => ({
                ...stat,
                ingresoTotal: stat.ingresoTotal || 0
            })),
            eventosPopulares: eventosPopulares.map(evento => ({
                ...evento,
                nameEvent: descifrarSeguro(evento.nameEvent)
            })),
            ventasPorMes: ventasPorMes,
            modulos: {
                cines: estadisticasCines[0] || {},
                conciertos: estadisticasConciertos[0] || {},
                transporte: estadisticasTransporte[0] || {}
            }
        });

    } catch (error) {
        console.error('Error al obtener dashboard:', error);
        return res.status(500).json({ message: 'Error al obtener dashboard', error: error.message });
    }
};

// ================ BÚSQUEDA UNIFICADA ================

// Búsqueda general de eventos
eventsCtl.buscarEventos = async (req, res) => {
    try {
        const { q, eventType, dateFrom, dateTo, minPrice, maxPrice } = req.query;

        let query = `
            SELECT e.*, COUNT(t.idTicket) as ticketsVendidos
            FROM events e
            LEFT JOIN tickets t ON e.idEvent = t.eventId
            WHERE e.stateEvent = 1
        `;

        const params = [];

        if (q) {
            query += ' AND (e.nameEvent LIKE ? OR e.descriptionEvent LIKE ? OR e.venue LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (eventType) {
            query += ' AND e.eventType = ?';
            params.push(eventType);
        }

        if (dateFrom) {
            query += ' AND e.dateTimeEvent >= ?';
            params.push(dateFrom);
        }

        if (dateTo) {
            query += ' AND e.dateTimeEvent <= ?';
            params.push(dateTo);
        }

        query += ' GROUP BY e.idEvent ORDER BY e.dateTimeEvent ASC';

        const [eventos] = await sql.promise().query(query, params);

        const eventosCompletos = eventos.map(evento => ({
            ...evento,
            nameEvent: descifrarSeguro(evento.nameEvent),
            descriptionEvent: descifrarSeguro(evento.descriptionEvent),
            venue: descifrarSeguro(evento.venue),
            ticketsVendidos: evento.ticketsVendidos || 0
        }));

        return res.json(eventosCompletos);
    } catch (error) {
        console.error('Error al buscar eventos:', error);
        return res.status(500).json({ message: 'Error al buscar eventos', error: error.message });
    }
};

// ================ GESTIÓN DE STAFF ================

// Obtener personal asignado a eventos
eventsCtl.obtenerStaffEventos = async (req, res) => {
    try {
        const [staff] = await sql.promise().query(`
            SELECT s.*, sa.assignmentType, sa.assignmentDate, sa.startTime, sa.endTime,
                   sa.locationAssignment, sa.statusAssignment, u.nameUsers, u.emailUser
            FROM staff s
            JOIN users u ON s.usuarioId = u.idUser
            LEFT JOIN staffAssignments sa ON s.idStaff = sa.staffId
            WHERE s.stateStaff = 1 AND sa.stateAssignment = 1
            ORDER BY sa.assignmentDate DESC
        `);

        const staffCompleto = staff.map(member => ({
            ...member,
            nameStaff: descifrarSeguro(member.nameStaff),
            emailStaff: descifrarSeguro(member.emailStaff),
            phoneStaff: descifrarSeguro(member.phoneStaff),
            nameUsers: descifrarSeguro(member.nameUsers),
            emailUser: descifrarSeguro(member.emailUser),
            locationAssignment: descifrarSeguro(member.locationAssignment)
        }));

        return res.json(staffCompleto);
    } catch (error) {
        console.error('Error al obtener staff:', error);
        return res.status(500).json({ message: 'Error al obtener staff', error: error.message });
    }
};

// Asignar personal a evento
eventsCtl.asignarStaffEvento = async (req, res) => {
    try {
        const {
            staffId, assignmentType, assignmentDate, startTime, endTime,
            locationAssignment, responsibilitiesAssignment
        } = req.body;

        // Validaciones
        if (!staffId || !assignmentType || !assignmentDate || !startTime || !endTime) {
            return res.status(400).json({ message: 'Staff, tipo, fecha y horarios son obligatorios' });
        }

        // Crear asignación
        const nuevaAsignacion = await orm.StaffAssignment.create({
            staffId: parseInt(staffId),
            assignmentType: assignmentType,
            assignmentDate: new Date(assignmentDate),
            startTime: startTime,
            endTime: endTime,
            locationAssignment: cifrarDatos(locationAssignment || ''),
            responsibilitiesAssignment: responsibilitiesAssignment || '',
            statusAssignment: 'scheduled',
            stateAssignment: true,
            createAssignment: new Date().toLocaleString(),
        });

        return res.status(201).json({
            message: 'Personal asignado exitosamente',
            idAssignment: nuevaAsignacion.idStaffAssignment
        });

    } catch (error) {
        console.error('Error al asignar personal:', error);
        return res.status(500).json({
            message: 'Error al asignar personal',
            error: error.message
        });
    }
};

// ================ NOTIFICACIONES ================

// Obtener notificaciones de usuario
eventsCtl.obtenerNotificaciones = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        const notificaciones = await mongo.notificationModel.find({
            userId: usuarioId
        }).sort({ createdAt: -1 }).limit(50);

        return res.json(notificaciones);
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        return res.status(500).json({ message: 'Error al obtener notificaciones', error: error.message });
    }
};

// Marcar notificación como leída
eventsCtl.marcarNotificacionLeida = async (req, res) => {
    try {
        const { id } = req.params;

        await mongo.notificationModel.findByIdAndUpdate(id, {
            read: true,
            sentDate: new Date()
        });

        return res.json({ message: 'Notificación marcada como leída' });
    } catch (error) {
        console.error('Error al marcar notificación:', error);
        return res.status(500).json({ message: 'Error al marcar notificación', error: error.message });
    }
};

// ================ FUNCIONES AUXILIARES ================

// Validar ticket por QR
eventsCtl.validarTicketQR = async (req, res) => {
    try {
        const { qrCode } = req.body;

        const [ticket] = await sql.promise().query(`
            SELECT t.*, e.nameEvent, e.eventType, e.dateTimeEvent, u.nameUsers
            FROM tickets t
            JOIN events e ON t.eventId = e.idEvent
            JOIN users u ON t.usuarioId = u.idUser
            WHERE t.qrCode = ?
        `, [qrCode]);

        if (ticket.length === 0) {
            return res.status(404).json({ message: 'Ticket no encontrado' });
        }

        const ticketData = ticket[0];

        if (ticketData.statusTicket === 'used') {
            return res.status(400).json({ message: 'Ticket ya utilizado' });
        }

        if (ticketData.statusTicket === 'cancelled') {
            return res.status(400).json({ message: 'Ticket cancelado' });
        }

        // Marcar como usado
        await sql.promise().query(
            'UPDATE tickets SET statusTicket = ?, updateTicket = ? WHERE qrCode = ?',
            ['used', new Date().toLocaleString(), qrCode]
        );

        return res.json({
            message: 'Ticket válido',
            ticket: {
                ...ticketData,
                nameEvent: descifrarSeguro(ticketData.nameEvent),
                nameUsers: descifrarSeguro(ticketData.nameUsers)
            }
        });

    } catch (error) {
        console.error('Error al validar ticket:', error);
        return res.status(500).json({ message: 'Error al validar ticket', error: error.message });
    }
};

// Cancelar evento
eventsCtl.cancelarEvento = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        // Actualizar estado del evento
        await sql.promise().query(
            'UPDATE events SET statusEvent = ?, updateEvent = ? WHERE idEvent = ?',
            ['cancelled', new Date().toLocaleString(), id]
        );

        // Actualizar tickets relacionados
        await sql.promise().query(
            'UPDATE tickets SET statusTicket = ?, updateTicket = ? WHERE eventId = ?',
            ['cancelled', new Date().toLocaleString(), id]
        );

        return res.json({ message: 'Evento cancelado exitosamente' });
    } catch (error) {
        console.error('Error al cancelar evento:', error);
        return res.status(500).json({ message: 'Error al cancelar evento', error: error.message });
    }
};
// Editar evento
eventsCtl.editarEvento = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nameEvent,
            descriptionEvent,
            venue,
            dateTimeEvent,
            capacity,
            imageUrl
        } = req.body;

        // Verificar si existe
        const [evento] = await sql.promise().query(
            'SELECT idEvent FROM events WHERE idEvent = ? AND stateEvent = 1',
            [id]
        );

        if (evento.length === 0) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        await sql.promise().query(
            `UPDATE events 
             SET nameEvent = ?, 
                 descriptionEvent = ?, 
                 venue = ?, 
                 dateTimeEvent = ?, 
                 capacity = ?, 
                 imageUrl = ?, 
                 updateEvent = ?
             WHERE idEvent = ?`,
            [
                cifrarDatos(nameEvent),
                cifrarDatos(descriptionEvent || ''),
                cifrarDatos(venue || ''),
                new Date(dateTimeEvent),
                capacity || 0,
                imageUrl || '',
                new Date().toLocaleString(),
                id
            ]
        );

        return res.json({ message: 'Evento actualizado correctamente' });

    } catch (error) {
        console.error('Error al editar evento:', error);
        return res.status(500).json({
            message: 'Error al editar evento',
            error: error.message
        });
    }
};

// Eliminar evento (soft delete)
eventsCtl.eliminarEvento = async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await sql.promise().query(
            `UPDATE events 
             SET stateEvent = 0, updateEvent = ?
             WHERE idEvent = ?`,
            [new Date().toLocaleString(), id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        // 🔥 BORRAR TAMBIÉN EN MONGO
        await EventSettings.deleteOne({ eventIdMysql: id });

        return res.json({ message: 'Evento eliminado correctamente' });

    } catch (error) {
        console.error('Error al eliminar evento:', error);
        return res.status(500).json({
            message: 'Error al eliminar evento',
            error: error.message
        });
    }
};


module.exports = eventsCtl;