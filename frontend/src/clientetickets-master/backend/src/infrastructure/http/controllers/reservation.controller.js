const reservationsCtl = {};
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

// Función para generar código de reserva único
const generarCodigoReserva = (tipo) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    const prefijo = tipo.toUpperCase().substr(0, 3);
    return `${prefijo}-${timestamp}-${random.toUpperCase()}`;
};

// ================ GESTIÓN UNIFICADA DE RESERVAS ================

// Obtener todas las reservas de un usuario con filtros avanzados
reservationsCtl.obtenerReservasUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { 
            tipo, estado, startDate, endDate, page = 1, limit = 20,
            sortBy = 'fecha', sortOrder = 'desc'
        } = req.query;

        // Validar usuario
        const [usuarioExiste] = await sql.promise().query(
            'SELECT idUser FROM users WHERE idUser = ? AND stateUser = "active"',
            [usuarioId]
        );

        if (usuarioExiste.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        let todasLasReservas = [];

        // Reservas de Cinema
        if (!tipo || tipo === 'cinema') {
            let queryCinema = `
               select * from reservations r
               where usuarioId = ?
               
            `;

            const paramsCinema = [usuarioId];

            if (estado) {
                queryCinema += ' AND r.stateReservation = ?';
                paramsCinema.push(estado);
            }

            if (startDate) {
                queryCinema += ' AND DATE(r.dateReservation) >= ?';
                paramsCinema.push(startDate);
            }

            if (endDate) {
                queryCinema += ' AND DATE(r.dateReservation) <= ?';
                paramsCinema.push(endDate);
            }

            queryCinema += ' ORDER BY r.dateReservation DESC';

            const [cinema] = await sql.promise().query(queryCinema, paramsCinema);
            
            todasLasReservas.push(...cinema.map(r => ({
                id: r.idReservation,
                codigo: r.codeReservation,
                tipo: r.tipoReserva,
                titulo: descifrarSeguro(r.titulo),
                venue: descifrarSeguro(r.venue),
                detalle: r.sala ? descifrarSeguro(r.sala) : null,
                fechaEvento: r.fechaEvento,
                horaEvento: r.horaEvento,
                horaFin: r.horaFin,
                fechaReserva: r.dateReservation,
                fechaExpiracion: r.expirationDate,
                estado: r.stateReservation,
                total: r.totalReservation,
                asientos: r.numberSeats,
                subtotalTickets: r.subtotalTickets,
                subtotalProducts: r.subtotalProducts,
                metodoPago: r.paymentMethod,
                origen: r.originReservation,
                formato: r.formato,
                idioma: r.idioma,
                subtitulos: r.subtitulos,
                // Campos adicionales para mejor UX
                puedeModificar: ['Pending', 'Confirmed'].includes(r.stateReservation),
                puedeCancelar: ['Pending', 'Confirmed'].includes(r.stateReservation),
                estaVencida: new Date() > new Date(r.expirationDate),
                tiempoRestante: Math.max(0, Math.floor((new Date(r.expirationDate) - new Date()) / (1000 * 60))) // minutos
            })));
        }

        // Reservas de Concert
        if (!tipo || tipo === 'concert') {
            let queryConcert = `
                SELECT cr.*, 'concert' as tipoReserva, c.nameConcert as titulo,
                       v.nameVenue as venue, cs.sectionName as seccion,
                       c.dateConcert as fechaEvento, c.startTime as horaEvento,
                       c.endTime as horaFin, a.nameArtist as artista,
                       cst.rowIdentifier as fila, cst.seatNumber as numeroAsiento,
                       cst.seatType as tipoAsiento
                FROM concertReservations cr
                JOIN concerts c ON cr.concertId = c.idConcert
                JOIN artists a ON c.artistId = a.idArtist
                JOIN concertVenues v ON c.venueId = v.idConcertVenue
                LEFT JOIN concertSeats cst ON cr.seatId = cst.idConcertSeat
                LEFT JOIN concertSections cs ON cst.sectionId = cs.idConcertSection
                WHERE cr.usuarioId = ?
            `;

            const paramsConcert = [usuarioId];

            if (estado) {
                queryConcert += ' AND cr.statusReservation = ?';
                paramsConcert.push(estado);
            }

            if (startDate) {
                queryConcert += ' AND DATE(cr.createConcertReservation) >= ?';
                paramsConcert.push(startDate);
            }

            if (endDate) {
                queryConcert += ' AND DATE(cr.createConcertReservation) <= ?';
                paramsConcert.push(endDate);
            }

            queryConcert += ' ORDER BY cr.createConcertReservation DESC';

            const [concert] = await sql.promise().query(queryConcert, paramsConcert);
            
            todasLasReservas.push(...concert.map(r => ({
                id: r.idConcertReservation,
                codigo: r.reservationCode,
                tipo: r.tipoReserva,
                titulo: descifrarSeguro(r.titulo),
                venue: descifrarSeguro(r.venue),
                detalle: r.seccion ? descifrarSeguro(r.seccion) : null,
                fechaEvento: r.fechaEvento,
                horaEvento: r.horaEvento,
                horaFin: r.horaFin,
                fechaReserva: r.createConcertReservation,
                estado: r.statusReservation,
                total: r.pricePaid,
                tipoTicket: r.ticketType,
                artista: descifrarSeguro(r.artista),
                fila: r.fila ? descifrarSeguro(r.fila) : null,
                numeroAsiento: r.numeroAsiento,
                tipoAsiento: r.tipoAsiento,
                solicitudesEspeciales: r.specialRequests,
                necesidadesAccesibilidad: r.accessibilityNeeds,
                // Campos adicionales
                puedeModificar: ['reserved', 'confirmed'].includes(r.statusReservation),
                puedeCancelar: ['reserved', 'confirmed'].includes(r.statusReservation),
                esVip: r.tipoTicket === 'VIP'
            })));
        }

        // Reservas de Transport
        if (!tipo || tipo === 'transport') {
            let queryTransport = `
                SELECT tr.*, 'transport' as tipoReserva, rt.routeName as titulo,
                       CONCAT(rt.origin, ' - ', rt.destination) as venue,
                       tv.vehicleModel as vehiculo, tv.vehicleCode as codigoVehiculo,
                       ts.departureTime as fechaEvento, ts.arrivalTime as horaLlegada,
                       ts.gateTerminal as puerta, ts.platform as plataforma,
                       tc.nameCompany as empresa, tst.seatNumber as numeroAsiento,
                       tst.seatClass as claseAsiento, tst.seatType as tipoAsiento
                FROM transportReservations tr
                JOIN transportSchedules ts ON tr.scheduleId = ts.idTransportSchedule
                JOIN transportVehicles tv ON ts.vehicleId = tv.idTransportVehicle
                JOIN transportRoutes rt ON tv.routeId = rt.idTransportRoute
                JOIN transportCompanies tc ON rt.companyId = tc.idTransportCompany
                LEFT JOIN transportSeats tst ON tr.seatId = tst.idTransportSeat
                WHERE tr.usuarioId = ?
            `;

            const paramsTransport = [usuarioId];

            if (estado) {
                queryTransport += ' AND tr.statusReservation = ?';
                paramsTransport.push(estado);
            }

            if (startDate) {
                queryTransport += ' AND DATE(tr.createTransportReservation) >= ?';
                paramsTransport.push(startDate);
            }

            if (endDate) {
                queryTransport += ' AND DATE(tr.createTransportReservation) <= ?';
                paramsTransport.push(endDate);
            }

            queryTransport += ' ORDER BY tr.createTransportReservation DESC';

            const [transport] = await sql.promise().query(queryTransport, paramsTransport);
            
            todasLasReservas.push(...transport.map(r => ({
                id: r.idTransportReservation,
                codigo: r.reservationCode,
                tipo: r.tipoReserva,
                titulo: descifrarSeguro(r.titulo),
                venue: descifrarSeguro(r.venue),
                detalle: r.vehiculo,
                fechaEvento: r.fechaEvento,
                horaLlegada: r.horaLlegada,
                fechaReserva: r.createTransportReservation,
                estado: r.statusReservation,
                total: r.priceReservation,
                pasajero: descifrarSeguro(r.passengerName),
                documentoPasajero: r.passengerDocument,
                emailPasajero: descifrarSeguro(r.passengerEmail),
                telefonoPasajero: descifrarSeguro(r.passengerPhone),
                clase: r.bookingClass,
                empresa: descifrarSeguro(r.empresa),
                codigoVehiculo: r.codigoVehiculo,
                puerta: r.puerta,
                plataforma: r.plataforma,
                numeroAsiento: r.numeroAsiento,
                claseAsiento: r.claseAsiento,
                tipoAsiento: r.tipoAsiento,
                solicitudesEspeciales: r.specialRequests,
                equipaje: r.luggageInfo,
                fechaCheckIn: r.checkInTime,
                // Campos adicionales
                puedeModificar: ['confirmed'].includes(r.statusReservation),
                puedeCancelar: ['confirmed'].includes(r.statusReservation),
                puedeCheckIn: r.statusReservation === 'confirmed' && !r.checkInTime,
                yaHizoCheckIn: !!r.checkInTime
            })));
        }

        // Ordenar según parámetros
        const campoOrden = sortBy === 'fecha' ? 'fechaReserva' : 
                          sortBy === 'evento' ? 'fechaEvento' : 
                          sortBy === 'total' ? 'total' : 'fechaReserva';

        todasLasReservas.sort((a, b) => {
            let valA = a[campoOrden];
            let valB = b[campoOrden];

            if (campoOrden === 'total') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            } else {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            if (sortOrder === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });

        // Paginación
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const reservasPaginadas = todasLasReservas.slice(startIndex, endIndex);

        // Estadísticas rápidas
        const estadisticas = {
            total: todasLasReservas.length,
            pendientes: todasLasReservas.filter(r => ['Pending', 'reserved', 'confirmed'].includes(r.estado)).length,
            completadas: todasLasReservas.filter(r => ['Paid', 'used', 'boarded'].includes(r.estado)).length,
            canceladas: todasLasReservas.filter(r => ['Cancelled', 'cancelled'].includes(r.estado)).length,
            ingresoTotal: todasLasReservas.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0),
            proximosEventos: todasLasReservas.filter(r => 
                r.fechaEvento && new Date(r.fechaEvento) > new Date()
            ).length
        };

        return res.json({
            reservas: reservasPaginadas,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(todasLasReservas.length / parseInt(limit)),
                totalRecords: todasLasReservas.length,
                limit: parseInt(limit)
            },
            estadisticas: estadisticas,
            filtros: {
                tipo: tipo || 'todos',
                estado: estado || 'todos',
                fechaInicio: startDate,
                fechaFin: endDate,
                ordenPor: sortBy,
                ordenDireccion: sortOrder
            }
        });

    } catch (error) {
        console.error('Error al obtener reservas:', error);
        return res.status(500).json({ message: 'Error al obtener reservas', error: error.message });
    }
};

// ================ CREACIÓN DE RESERVAS UNIFICADA ================

// Crear nueva reserva (endpoint unificado)
reservationsCtl.crearReserva = async (req, res) => {
    try {
        const { tipo } = req.params;
        const datosReserva = req.body;

        if (!['cinema', 'concert', 'transport'].includes(tipo)) {
            return res.status(400).json({ message: 'Tipo de reserva inválido' });
        }

        let resultado;

        switch (tipo) {
            case 'cinema':
                resultado = await crearReservaCinema(datosReserva);
                break;
            case 'concert':
                resultado = await crearReservaConcierto(datosReserva);
                break;
            case 'transport':
                resultado = await crearReservaTransporte(datosReserva);
                break;
        }

        // Crear evento unificado si es exitoso
        if (resultado.success) {
            await crearEventoUnificado(tipo, resultado.reserva, datosReserva.usuarioId);
            
            // Enviar notificación (integración con notifications controller)
            await enviarNotificacionReserva(tipo, resultado.reserva, 'created');
        }

        return res.status(201).json(resultado);

    } catch (error) {
        console.error('Error al crear reserva:', error);
        return res.status(500).json({ 
            message: 'Error al crear reserva', 
            error: error.message 
        });
    }
};

// Funciones auxiliares para crear reservas específicas
async function crearReservaCinema(datos) {
    const { 
        usuarioId, functionId, selectedSeats, paymentMethod,
        subtotalTickets, subtotalProducts, serviceCommission,
        productos = []
    } = datos;

    // Validaciones específicas
    if (!usuarioId || !functionId || !selectedSeats || selectedSeats.length === 0) {
        throw new Error('Usuario, función y asientos son obligatorios');
    }

    // Verificar disponibilidad de la función
    const [funcion] = await sql.promise().query(`
        SELECT f.*, m.titleMovie, r.nameRoom, c.nameCinema
        FROM functions f
        JOIN movies m ON f.movieId = m.idMovie
        JOIN rooms r ON f.roomId = r.idRoom
        JOIN cinemas c ON r.cinemaId = c.idCinema
        WHERE f.idFunction = ? AND f.activeFunction = 1
    `, [functionId]);

    if (funcion.length === 0) {
        throw new Error('Función no encontrada o no activa');
    }

    const funcionData = funcion[0];
    const asientosDisponibles = funcionData.availableSeats - funcionData.reservedSeats - funcionData.soldSeats;

    if (asientosDisponibles < selectedSeats.length) {
        throw new Error(`Solo hay ${asientosDisponibles} asientos disponibles`);
    }

    // Generar código único
    const codigoReserva = generarCodigoReserva('CINEMA');
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

    // Actualizar asientos reservados en la función
    await sql.promise().query(
        'UPDATE functions SET reservedSeats = reservedSeats + ? WHERE idFunction = ?',
        [selectedSeats.length, functionId]
    );

    // Crear registros de asientos reservados
    for (const seat of selectedSeats) {
        await orm.ReservedSeat.create({
            reservationId: nuevaReserva.idReservation,
            seatId: seat.seatId,
            paidPrice: seat.price || funcionData.basePrice,
            ticketType: seat.type || 'Regular',
            appliedDiscount: seat.discount || 0,
            createReservedSeat: new Date().toLocaleString()
        });
    }

    return {
        success: true,
        message: 'Reserva de cinema creada exitosamente',
        reserva: {
            id: nuevaReserva.idReservation,
            codigo: codigoReserva,
            tipo: 'cinema',
            total: totalReservation,
            expira: expirationDate,
            pelicula: descifrarSeguro(funcionData.titleMovie),
            cine: descifrarSeguro(funcionData.nameCinema),
            sala: descifrarSeguro(funcionData.nameRoom),
            fecha: funcionData.dateFunction,
            hora: funcionData.startTime
        }
    };
}

async function crearReservaConcierto(datos) {
    const { 
        usuarioId, concertId, seatId, ticketType, pricePaid,
        specialRequests, accessibilityNeeds
    } = datos;

    // Validaciones
    if (!usuarioId || !concertId || !pricePaid) {
        throw new Error('Usuario, concierto y precio son obligatorios');
    }

    // Verificar que el concierto existe y está activo
    const [concierto] = await sql.promise().query(`
        SELECT c.*, a.nameArtist, v.nameVenue
        FROM concerts c
        JOIN artists a ON c.artistId = a.idArtist
        JOIN concertVenues v ON c.venueId = v.idConcertVenue
        WHERE c.idConcert = ? AND c.stateConcert = 1
    `, [concertId]);

    if (concierto.length === 0) {
        throw new Error('Concierto no encontrado');
    }

    const conciertoData = concierto[0];

    // Verificar disponibilidad del asiento si se especifica
    if (seatId) {
        const [asientoOcupado] = await sql.promise().query(`
            SELECT idConcertReservation FROM concertReservations 
            WHERE seatId = ? AND statusReservation IN ('reserved', 'confirmed')
        `, [seatId]);

        if (asientoOcupado.length > 0) {
            throw new Error('El asiento seleccionado ya está ocupado');
        }
    }

    // Generar código único
    const reservationCode = generarCodigoReserva('CONCERT');

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

    return {
        success: true,
        message: 'Reserva de concierto creada exitosamente',
        reserva: {
            id: nuevaReserva.idConcertReservation,
            codigo: reservationCode,
            tipo: 'concert',
            total: parseFloat(pricePaid),
            concierto: descifrarSeguro(conciertoData.nameConcert),
            artista: descifrarSeguro(conciertoData.nameArtist),
            venue: descifrarSeguro(conciertoData.nameVenue),
            fecha: conciertoData.dateConcert,
            hora: conciertoData.startTime
        }
    };
}

async function crearReservaTransporte(datos) {
    const { 
        usuarioId, scheduleId, seatId, passengerName, passengerDocument,
        passengerEmail, passengerPhone, bookingClass, priceReservation,
        specialRequests, luggageInfo
    } = datos;

    // Validaciones
    if (!usuarioId || !scheduleId || !passengerName || !passengerEmail || !priceReservation) {
        throw new Error('Usuario, horario, pasajero, email y precio son obligatorios');
    }

    // Verificar horario y disponibilidad
    const [horario] = await sql.promise().query(`
        SELECT ts.*, tv.vehicleCode, tr.routeName, tr.origin, tr.destination, tc.nameCompany
        FROM transportSchedules ts
        JOIN transportVehicles tv ON ts.vehicleId = tv.idTransportVehicle
        JOIN transportRoutes tr ON tv.routeId = tr.idTransportRoute
        JOIN transportCompanies tc ON tr.companyId = tc.idTransportCompany
        WHERE ts.idTransportSchedule = ? AND ts.stateSchedule = 1
    `, [scheduleId]);

    if (horario.length === 0) {
        throw new Error('Horario no encontrado');
    }

    const horarioData = horario[0];

    if (horarioData.availableSeats <= 0) {
        throw new Error('No hay asientos disponibles en este horario');
    }

    // Verificar disponibilidad del asiento si se especifica
    if (seatId) {
        const [asientoOcupado] = await sql.promise().query(`
            SELECT idTransportReservation FROM transportReservations 
            WHERE seatId = ? AND statusReservation IN ('confirmed', 'checked_in', 'boarded')
        `, [seatId]);

        if (asientoOcupado.length > 0) {
            throw new Error('El asiento seleccionado ya está ocupado');
        }
    }

    // Generar código único
    const reservationCode = generarCodigoReserva('TRANSPORT');

    // Crear reserva
    const nuevaReserva = await orm.TransportReservation.create({
        usuarioId: parseInt(usuarioId),
        scheduleId: parseInt(scheduleId),
        seatId: seatId ? parseInt(seatId) : null,
        reservationCode: reservationCode,
        passengerName: cifrarDatos(passengerName),
        passengerDocument: passengerDocument || '',
        passengerEmail: cifrarDatos(passengerEmail),
        passengerPhone: cifrarDatos(passengerPhone || ''),
        bookingClass: bookingClass || 'economy',
        priceReservation: parseFloat(priceReservation),
        statusReservation: 'confirmed',
        specialRequests: specialRequests || '',
        luggageInfo: luggageInfo || '',
        createTransportReservation: new Date().toLocaleString(),
    });

    // Actualizar asientos disponibles
    await sql.promise().query(
        'UPDATE transportSchedules SET availableSeats = availableSeats - 1 WHERE idTransportSchedule = ?',
        [scheduleId]
    );

    return {
        success: true,
        message: 'Reserva de transporte creada exitosamente',
        reserva: {
            id: nuevaReserva.idTransportReservation,
            codigo: reservationCode,
            tipo: 'transport',
            total: parseFloat(priceReservation),
            ruta: descifrarSeguro(horarioData.routeName),
            origen: descifrarSeguro(horarioData.origin),
            destino: descifrarSeguro(horarioData.destination),
            empresa: descifrarSeguro(horarioData.nameCompany),
            fechaSalida: horarioData.departureTime,
            fechaLlegada: horarioData.arrivalTime
        }
    };
}

// ================ MODIFICACIÓN DE RESERVAS ================

// Modificar reserva (endpoint mejorado)
reservationsCtl.modificarReserva = async (req, res) => {
    try {
        const { tipo, id } = req.params;
        const { accion, datos, usuarioId } = req.body;

        if (!['cinema', 'concert', 'transport'].includes(tipo)) {
            return res.status(400).json({ message: 'Tipo de reserva inválido' });
        }

        // Validar que el usuario es propietario de la reserva
        const esOwner = await validarPropietarioReserva(tipo, id, usuarioId);
        if (!esOwner) {
            return res.status(403).json({ message: 'No tienes permisos para modificar esta reserva' });
        }

        let resultado;

        switch (tipo) {
            case 'cinema':
                resultado = await modificarReservaCinema(id, accion, datos);
                break;
            case 'concert':
                resultado = await modificarReservaConcierto(id, accion, datos);
                break;
            case 'transport':
                resultado = await modificarReservaTransporte(id, accion, datos);
                break;
        }

        // Enviar notificación de modificación
        await enviarNotificacionReserva(tipo, { id: id }, 'modified');

        return res.json(resultado);

    } catch (error) {
        console.error('Error al modificar reserva:', error);
        return res.status(500).json({ message: 'Error al modificar reserva', error: error.message });
    }
};

// Funciones de modificación específicas (mejoradas)
async function modificarReservaCinema(id, accion, datos) {
    const [reserva] = await sql.promise().query(
        'SELECT * FROM reservations WHERE idReservation = ?',
        [id]
    );

    if (reserva.length === 0) {
        throw new Error('Reserva no encontrada');
    }

    const reservaData = reserva[0];

    if (!['Pending', 'Confirmed'].includes(reservaData.stateReservation)) {
        throw new Error('Solo se pueden modificar reservas pendientes o confirmadas');
    }

    switch (accion) {
        case 'cambiar_fecha':
            return await cambiarFechaFuncion(id, datos, reservaData);
        case 'cambiar_asientos':
            return await cambiarAsientosCinema(id, datos, reservaData);
        case 'agregar_productos':
            return await agregarProductosReserva(id, datos, reservaData);
        case 'actualizar_contacto':
            return await actualizarContactoReserva('cinema', id, datos);
        default:
            throw new Error('Acción no soportada para reservas de cinema');
    }
}

async function modificarReservaConcierto(id, accion, datos) {
    const [reserva] = await sql.promise().query(
        'SELECT * FROM concertReservations WHERE idConcertReservation = ?',
        [id]
    );

    if (reserva.length === 0) {
        throw new Error('Reserva no encontrada');
    }

    const reservaData = reserva[0];

    if (!['reserved', 'confirmed'].includes(reservaData.statusReservation)) {
        throw new Error('Solo se pueden modificar reservas reservadas o confirmadas');
    }

    switch (accion) {
        case 'cambiar_asientos':
            return await cambiarAsientoConcierto(id, datos, reservaData);
        case 'actualizar_solicitudes':
            return await actualizarSolicitudesEspeciales('concert', id, datos);
        case 'cambiar_tipo_ticket':
            return await cambiarTipoTicket(id, datos, reservaData);
        case 'actualizar_contacto':
            return await actualizarContactoReserva('concert', id, datos);
        default:
            throw new Error('Acción no soportada para reservas de conciertos');
    }
}

async function modificarReservaTransporte(id, accion, datos) {
    const [reserva] = await sql.promise().query(
        'SELECT * FROM transportReservations WHERE idTransportReservation = ?',
        [id]
    );

    if (reserva.length === 0) {
        throw new Error('Reserva no encontrada');
    }

    const reservaData = reserva[0];

    if (!['confirmed'].includes(reservaData.statusReservation)) {
        throw new Error('Solo se pueden modificar reservas confirmadas');
    }

    switch (accion) {
        case 'cambiar_fecha':
            return await cambiarHorarioTransporte(id, datos, reservaData);
        case 'cambiar_asientos':
            return await cambiarAsientoTransporte(id, datos, reservaData);
        case 'actualizar_pasajero':
            return await actualizarDatosPasajero(id, datos, reservaData);
        case 'actualizar_equipaje':
            return await actualizarEquipaje(id, datos, reservaData);
        default:
            throw new Error('Acción no soportada para reservas de transporte');
    }
}

// Funciones auxiliares para modificaciones específicas
async function cambiarFechaFuncion(reservaId, datos, reservaData) {
    const { nuevaFuncionId } = datos;

    if (!nuevaFuncionId) {
        throw new Error('Nueva función es obligatoria');
    }

    // Verificar que la nueva función existe y tiene disponibilidad
    const [nuevaFuncion] = await sql.promise().query(`
        SELECT * FROM functions WHERE idFunction = ? AND activeFunction = 1
    `, [nuevaFuncionId]);

    if (nuevaFuncion.length === 0) {
        throw new Error('Nueva función no encontrada o no activa');
    }

    const funcionData = nuevaFuncion[0];
    const asientosDisponibles = funcionData.availableSeats - funcionData.reservedSeats - funcionData.soldSeats;

    if (asientosDisponibles < reservaData.numberSeats) {
        throw new Error(`La nueva función no tiene suficientes asientos disponibles`);
    }

    // Liberar asientos de la función anterior
    await sql.promise().query(
        'UPDATE functions SET reservedSeats = reservedSeats - ? WHERE idFunction = ?',
        [reservaData.numberSeats, reservaData.functionId]
    );

    // Reservar asientos en la nueva función
    await sql.promise().query(
        'UPDATE functions SET reservedSeats = reservedSeats + ? WHERE idFunction = ?',
        [reservaData.numberSeats, nuevaFuncionId]
    );

    // Actualizar la reserva
    await sql.promise().query(
        'UPDATE reservations SET functionId = ?, updateReservation = ? WHERE idReservation = ?',
        [nuevaFuncionId, new Date().toLocaleString(), reservaId]
    );

    return { 
        message: 'Fecha de función cambiada exitosamente',
        nuevaFuncion: funcionData.dateFunction + ' ' + funcionData.startTime
    };
}

async function cambiarAsientosCinema(reservaId, datos, reservaData) {
    const { nuevosAsientos } = datos;

    if (!nuevosAsientos || nuevosAsientos.length === 0) {
        throw new Error('Nuevos asientos son obligatorios');
    }

    if (nuevosAsientos.length !== reservaData.numberSeats) {
        throw new Error('El número de asientos debe mantenerse igual');
    }

    // Verificar disponibilidad de los nuevos asientos
    for (const asiento of nuevosAsientos) {
        const [asientoOcupado] = await sql.promise().query(`
            SELECT rs.idReservedSeat FROM reservedSeats rs
            JOIN reservations r ON rs.reservationId = r.idReservation
            WHERE rs.seatId = ? AND r.functionId = ? AND r.stateReservation IN ('Pending', 'Confirmed', 'Paid')
            AND r.idReservation != ?
        `, [asiento.seatId, reservaData.functionId, reservaId]);

        if (asientoOcupado.length > 0) {
            throw new Error(`El asiento ${asiento.row}${asiento.number} ya está ocupado`);
        }
    }

    // Eliminar asientos actuales
    await sql.promise().query(
        'DELETE FROM reservedSeats WHERE reservationId = ?',
        [reservaId]
    );

    // Crear nuevos asientos reservados
    for (const asiento of nuevosAsientos) {
        await orm.ReservedSeat.create({
            reservationId: reservaId,
            seatId: asiento.seatId,
            paidPrice: asiento.price || reservaData.subtotalTickets / reservaData.numberSeats,
            ticketType: asiento.type || 'Regular',
            appliedDiscount: asiento.discount || 0,
            createReservedSeat: new Date().toLocaleString()
        });
    }

    await sql.promise().query(
        'UPDATE reservations SET updateReservation = ? WHERE idReservation = ?',
        [new Date().toLocaleString(), reservaId]
    );

    return { 
        message: 'Asientos cambiados exitosamente',
        nuevosAsientos: nuevosAsientos.map(a => `${a.row}${a.number}`)
    };
}

async function cambiarAsientoConcierto(reservaId, datos, reservaData) {
    const { nuevoAsientoId } = datos;

    if (!nuevoAsientoId) {
        throw new Error('Nuevo asiento es obligatorio');
    }

    // Verificar disponibilidad del nuevo asiento
    const [asientoOcupado] = await sql.promise().query(`
        SELECT idConcertReservation FROM concertReservations 
        WHERE seatId = ? AND statusReservation IN ('reserved', 'confirmed') AND idConcertReservation != ?
    `, [nuevoAsientoId, reservaId]);

    if (asientoOcupado.length > 0) {
        throw new Error('El nuevo asiento ya está ocupado');
    }

    // Actualizar el asiento
    await sql.promise().query(
        'UPDATE concertReservations SET seatId = ?, updateConcertReservation = ? WHERE idConcertReservation = ?',
        [nuevoAsientoId, new Date().toLocaleString(), reservaId]
    );

    return { message: 'Asiento cambiado exitosamente' };
}

async function cambiarAsientoTransporte(reservaId, datos, reservaData) {
    const { nuevoAsientoId } = datos;

    if (!nuevoAsientoId) {
        throw new Error('Nuevo asiento es obligatorio');
    }

    // Verificar disponibilidad
    const [asientoOcupado] = await sql.promise().query(`
        SELECT idTransportReservation FROM transportReservations 
        WHERE seatId = ? AND statusReservation IN ('confirmed', 'checked_in', 'boarded') 
        AND idTransportReservation != ?
    `, [nuevoAsientoId, reservaId]);

    if (asientoOcupado.length > 0) {
        throw new Error('El nuevo asiento ya está ocupado');
    }

    await sql.promise().query(
        'UPDATE transportReservations SET seatId = ?, updateTransportReservation = ? WHERE idTransportReservation = ?',
        [nuevoAsientoId, new Date().toLocaleString(), reservaId]
    );

    return { message: 'Asiento cambiado exitosamente' };
}

// ================ CANCELACIÓN DE RESERVAS AVANZADA ================

// Cancelar reserva con políticas específicas
reservationsCtl.cancelarReserva = async (req, res) => {
    try {
        const { tipo, id } = req.params;
        const { motivo, reembolso = false, usuarioId } = req.body;

        if (!['cinema', 'concert', 'transport'].includes(tipo)) {
            return res.status(400).json({ message: 'Tipo de reserva inválido' });
        }

        // Validar propietario
        const esOwner = await validarPropietarioReserva(tipo, id, usuarioId);
        if (!esOwner) {
            return res.status(403).json({ message: 'No tienes permisos para cancelar esta reserva' });
        }

        // Obtener políticas de cancelación
        const politicas = await obtenerPoliticasCancelacion(tipo, id);

        let resultado;

        switch (tipo) {
            case 'cinema':
                resultado = await cancelarReservaCinema(id, motivo, reembolso, politicas);
                break;
            case 'concert':
                resultado = await cancelarReservaConcierto(id, motivo, reembolso, politicas);
                break;
            case 'transport':
                resultado = await cancelarReservaTransporte(id, motivo, reembolso, politicas);
                break;
        }

        // Enviar notificación de cancelación
        await enviarNotificacionReserva(tipo, { id: id }, 'cancelled');

        return res.json(resultado);

    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        return res.status(500).json({ message: 'Error al cancelar reserva', error: error.message });
    }
};

async function cancelarReservaCinema(id, motivo, reembolso, politicas) {
    const [reserva] = await sql.promise().query(
        'SELECT * FROM reservations WHERE idReservation = ?',
        [id]
    );

    if (reserva.length === 0) {
        throw new Error('Reserva no encontrada');
    }

    const reservaData = reserva[0];

    if (['Cancelled', 'Expired', 'Used'].includes(reservaData.stateReservation)) {
        throw new Error('La reserva no se puede cancelar en su estado actual');
    }

    // Verificar política de cancelación
    const tiempoParaFuncion = (new Date(reservaData.expirationDate) - new Date()) / (1000 * 60 * 60); // horas
    
    let porcentajeReembolso = 0;
    if (tiempoParaFuncion > politicas.horasMinimas) {
        porcentajeReembolso = politicas.porcentajeReembolso;
    }

    // Cancelar reserva
    await sql.promise().query(
        'UPDATE reservations SET stateReservation = ?, updateReservation = ? WHERE idReservation = ?',
        ['Cancelled', new Date().toLocaleString(), id]
    );

    // Liberar asientos
    await sql.promise().query(`
        UPDATE functions f 
        JOIN reservations r ON f.idFunction = r.functionId 
        SET f.reservedSeats = f.reservedSeats - r.numberSeats 
        WHERE r.idReservation = ?
    `, [id]);

    let montoReembolso = 0;
    if (reembolso && porcentajeReembolso > 0) {
        montoReembolso = (reservaData.totalReservation * porcentajeReembolso) / 100;
        // Aquí se procesaría el reembolso real
    }

    return {
        message: 'Reserva de cinema cancelada exitosamente',
        codigo: reservaData.codeReservation,
        reembolso: {
            aplicable: porcentajeReembolso > 0,
            porcentaje: porcentajeReembolso,
            monto: montoReembolso
        },
        asientosLiberados: reservaData.numberSeats
    };
}

async function cancelarReservaConcierto(id, motivo, reembolso, politicas) {
    const [reserva] = await sql.promise().query(
        'SELECT * FROM concertReservations WHERE idConcertReservation = ?',
        [id]
    );

    if (reserva.length === 0) {
        throw new Error('Reserva no encontrada');
    }

    const reservaData = reserva[0];

    if (['cancelled', 'used'].includes(reservaData.statusReservation)) {
        throw new Error('La reserva no se puede cancelar en su estado actual');
    }

    await sql.promise().query(
        'UPDATE concertReservations SET statusReservation = ?, updateConcertReservation = ? WHERE idConcertReservation = ?',
        ['cancelled', new Date().toLocaleString(), id]
    );

    return {
        message: 'Reserva de concierto cancelada exitosamente',
        codigo: reservaData.reservationCode
    };
}

async function cancelarReservaTransporte(id, motivo, reembolso, politicas) {
    const [reserva] = await sql.promise().query(
        'SELECT * FROM transportReservations WHERE idTransportReservation = ?',
        [id]
    );

    if (reserva.length === 0) {
        throw new Error('Reserva no encontrada');
    }

    const reservaData = reserva[0];

    if (['cancelled', 'boarded'].includes(reservaData.statusReservation)) {
        throw new Error('La reserva no se puede cancelar en su estado actual');
    }

    await sql.promise().query(
        'UPDATE transportReservations SET statusReservation = ?, updateTransportReservation = ? WHERE idTransportReservation = ?',
        ['cancelled', new Date().toLocaleString(), id]
    );

    // Liberar asiento y actualizar disponibilidad
    await sql.promise().query(`
        UPDATE transportSchedules ts 
        JOIN transportReservations tr ON ts.idTransportSchedule = tr.scheduleId 
        SET ts.availableSeats = ts.availableSeats + 1 
        WHERE tr.idTransportReservation = ?
    `, [id]);

    return {
        message: 'Reserva de transporte cancelada exitosamente',
        codigo: reservaData.reservationCode
    };
}

// ================ VERIFICACIÓN DE DISPONIBILIDAD AVANZADA ================

reservationsCtl.verificarDisponibilidad = async (req, res) => {
    try {
        const { tipo } = req.params;
        const { resourceId, fecha, cantidad = 1, filtros = {} } = req.query;

        if (!['cinema', 'concert', 'transport'].includes(tipo)) {
            return res.status(400).json({ message: 'Tipo de recurso inválido' });
        }

        let resultado;

        switch (tipo) {
            case 'cinema':
                resultado = await verificarDisponibilidadCinema(resourceId, fecha, cantidad, filtros);
                break;
            case 'concert':
                resultado = await verificarDisponibilidadConcierto(resourceId, fecha, cantidad, filtros);
                break;
            case 'transport':
                resultado = await verificarDisponibilidadTransporte(resourceId, fecha, cantidad, filtros);
                break;
        }

        return res.json(resultado);

    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        return res.status(500).json({ message: 'Error al verificar disponibilidad', error: error.message });
    }
};

async function verificarDisponibilidadCinema(functionId, fecha, cantidad, filtros) {
    const [funcion] = await sql.promise().query(`
        SELECT f.*, m.titleMovie, r.nameRoom, c.nameCinema,
               (f.availableSeats - f.reservedSeats - f.soldSeats) as asientosLibres
        FROM functions f
        JOIN movies m ON f.movieId = m.idMovie
        JOIN rooms r ON f.roomId = r.idRoom
        JOIN cinemas c ON r.cinemaId = c.idCinema
        WHERE f.idFunction = ? AND f.activeFunction = 1
    `, [functionId]);

    if (funcion.length === 0) {
        return {
            disponible: false,
            motivo: 'Función no encontrada'
        };
    }

    const funcionData = funcion[0];
    const asientosDisponibles = funcionData.asientosLibres;
    const disponible = asientosDisponibles >= parseInt(cantidad);

    // Obtener asientos específicos disponibles si se solicita
    let asientosDetalle = null;
    if (filtros.incluirAsientos === 'true') {
        const [asientos] = await sql.promise().query(`
            SELECT s.*, 
                   CASE WHEN rs.idReservedSeat IS NOT NULL THEN 'ocupado' ELSE 'disponible' END as estado
            FROM seats s
            LEFT JOIN reservedSeats rs ON s.idSeat = rs.seatId
            LEFT JOIN reservations r ON rs.reservationId = r.idReservation AND r.functionId = ?
            WHERE s.roomId = ? AND s.stateSeat = 1
            ORDER BY s.rowSeat, s.numberSeat
        `, [functionId, funcionData.roomId]);

        asientosDetalle = asientos.map(asiento => ({
            id: asiento.idSeat,
            fila: asiento.rowSeat,
            numero: asiento.numberSeat,
            tipo: asiento.typeSeat,
            estado: asiento.estado,
            precio: funcionData.basePrice + asiento.additionalPrice
        }));
    }

    return {
        disponible: disponible,
        tipo: 'cinema',
        recurso: {
            id: functionId,
            pelicula: descifrarSeguro(funcionData.titleMovie),
            cine: descifrarSeguro(funcionData.nameCinema),
            sala: descifrarSeguro(funcionData.nameRoom),
            fecha: funcionData.dateFunction,
            hora: funcionData.startTime,
            formato: funcionData.formatFunction,
            idioma: funcionData.languageFunction
        },
        disponibilidad: {
            solicitados: parseInt(cantidad),
            disponibles: asientosDisponibles,
            capacidadTotal: funcionData.availableSeats,
            porcentajeOcupacion: ((funcionData.reservedSeats + funcionData.soldSeats) / funcionData.availableSeats * 100).toFixed(1)
        },
        precios: {
            base: funcionData.basePrice,
            vip: funcionData.vipPrice,
            premium: funcionData.premiumPrice
        },
        asientos: asientosDetalle
    };
}

async function verificarDisponibilidadConcierto(concertId, fecha, cantidad, filtros) {
    const [concierto] = await sql.promise().query(`
        SELECT c.*, a.nameArtist, v.nameVenue, v.capacity
        FROM concerts c
        JOIN artists a ON c.artistId = a.idArtist
        JOIN concertVenues v ON c.venueId = v.idConcertVenue
        WHERE c.idConcert = ? AND c.stateConcert = 1
    `, [concertId]);

    if (concierto.length === 0) {
        return {
            disponible: false,
            motivo: 'Concierto no encontrado'
        };
    }

    const conciertoData = concierto[0];

    // Calcular disponibilidad por secciones
    const [secciones] = await sql.promise().query(`
        SELECT cs.*, 
               COUNT(cst.idConcertSeat) as totalAsientos,
               COUNT(cr.idConcertReservation) as asientosReservados,
               (COUNT(cst.idConcertSeat) - COUNT(cr.idConcertReservation)) as asientosDisponibles
        FROM concertSections cs
        LEFT JOIN concertSeats cst ON cs.idConcertSection = cst.sectionId AND cst.stateConcertSeat = 1
        LEFT JOIN concertReservations cr ON cst.idConcertSeat = cr.seatId 
            AND cr.statusReservation IN ('reserved', 'confirmed')
        WHERE cs.venueId = ? AND cs.stateConcertSection = 1
        GROUP BY cs.idConcertSection
        ORDER BY cs.basePrice ASC
    `, [conciertoData.venueId]);

    const totalDisponibles = secciones.reduce((sum, seccion) => sum + (seccion.asientosDisponibles || 0), 0);
    const disponible = totalDisponibles >= parseInt(cantidad);

    return {
        disponible: disponible,
        tipo: 'concert',
        recurso: {
            id: concertId,
            concierto: descifrarSeguro(conciertoData.nameConcert),
            artista: descifrarSeguro(conciertoData.nameArtist),
            venue: descifrarSeguro(conciertoData.nameVenue),
            fecha: conciertoData.dateConcert,
            hora: conciertoData.startTime
        },
        disponibilidad: {
            solicitados: parseInt(cantidad),
            disponibles: totalDisponibles,
            capacidadTotal: conciertoData.capacity
        },
        secciones: secciones.map(seccion => ({
            id: seccion.idConcertSection,
            nombre: descifrarSeguro(seccion.sectionName),
            tipo: seccion.sectionType,
            precio: seccion.basePrice,
            disponibles: seccion.asientosDisponibles || 0,
            total: seccion.totalAsientos || 0,
            calidadVista: seccion.viewQuality
        }))
    };
}

async function verificarDisponibilidadTransporte(scheduleId, fecha, cantidad, filtros) {
    const [horario] = await sql.promise().query(`
        SELECT ts.*, tv.vehicleCode, tv.capacity, tr.routeName, tr.origin, tr.destination, tc.nameCompany
        FROM transportSchedules ts
        JOIN transportVehicles tv ON ts.vehicleId = tv.idTransportVehicle
        JOIN transportRoutes tr ON tv.routeId = tr.idTransportRoute
        JOIN transportCompanies tc ON tr.companyId = tc.idTransportCompany
        WHERE ts.idTransportSchedule = ? AND ts.stateSchedule = 1
    `, [scheduleId]);

    if (horario.length === 0) {
        return {
            disponible: false,
            motivo: 'Horario no encontrado'
        };
    }

    const horarioData = horario[0];
    const disponible = horarioData.availableSeats >= parseInt(cantidad);

    // Obtener asientos específicos si se solicita
    let asientosDetalle = null;
    if (filtros.incluirAsientos === 'true') {
        const [asientos] = await sql.promise().query(`
            SELECT ts.*, 
                   CASE WHEN tr.idTransportReservation IS NOT NULL THEN 'ocupado' ELSE 'disponible' END as estado
            FROM transportSeats ts
            LEFT JOIN transportReservations tr ON ts.idTransportSeat = tr.seatId 
                AND tr.statusReservation IN ('confirmed', 'checked_in', 'boarded')
            WHERE ts.vehicleId = ? AND ts.stateSeat = 1
            ORDER BY ts.seatNumber
        `, [horarioData.vehicleId]);

        asientosDetalle = asientos.map(asiento => ({
            id: asiento.idTransportSeat,
            numero: asiento.seatNumber,
            clase: asiento.seatClass,
            tipo: asiento.seatType,
            estado: asiento.estado,
            tarifaAdicional: asiento.additionalFee
        }));
    }

    return {
        disponible: disponible,
        tipo: 'transport',
        recurso: {
            id: scheduleId,
            ruta: descifrarSeguro(horarioData.routeName),
            origen: descifrarSeguro(horarioData.origin),
            destino: descifrarSeguro(horarioData.destination),
            empresa: descifrarSeguro(horarioData.nameCompany),
            vehiculo: horarioData.vehicleCode,
            salida: horarioData.departureTime,
            llegada: horarioData.arrivalTime
        },
        disponibilidad: {
            solicitados: parseInt(cantidad),
            disponibles: horarioData.availableSeats,
            capacidadTotal: horarioData.capacity
        },
        precios: {
            base: horarioData.priceSchedule
        },
        asientos: asientosDetalle
    };
}

// ================ FUNCIONES AUXILIARES ================

// Validar que el usuario es propietario de la reserva
async function validarPropietarioReserva(tipo, reservaId, usuarioId) {
    let query;
    let idField;

    switch (tipo) {
        case 'cinema':
            query = 'SELECT usuarioId FROM reservations WHERE idReservation = ?';
            break;
        case 'concert':
            query = 'SELECT usuarioId FROM concertReservations WHERE idConcertReservation = ?';
            break;
        case 'transport':
            query = 'SELECT usuarioId FROM transportReservations WHERE idTransportReservation = ?';
            break;
    }

    const [resultado] = await sql.promise().query(query, [reservaId]);
    return resultado.length > 0 && resultado[0].usuarioId == usuarioId;
}

// Obtener políticas de cancelación
async function obtenerPoliticasCancelacion(tipo, reservaId) {
    // Por defecto - en producción estas vendrían de configuración
    const politicasPorDefecto = {
        cinema: { horasMinimas: 2, porcentajeReembolso: 80 },
        concert: { horasMinimas: 24, porcentajeReembolso: 70 },
        transport: { horasMinimas: 4, porcentajeReembolso: 90 }
    };

    return politicasPorDefecto[tipo];
}

// Crear evento unificado
async function crearEventoUnificado(tipo, reserva, usuarioId) {
    try {
        await orm.Event.create({
            nameEvent: cifrarDatos(`Reserva ${tipo} - ${reserva.codigo}`),
            descriptionEvent: cifrarDatos(`Reserva de ${tipo} creada por usuario ${usuarioId}`),
            eventType: tipo,
            microserviceEventId: reserva.id.toString(),
            venue: cifrarDatos(reserva.venue || reserva.cine || reserva.empresa || ''),
            dateTimeEvent: new Date(reserva.fecha || reserva.fechaSalida || new Date()),
            capacity: 1,
            statusEvent: 'published',
            createdBy: usuarioId,
            stateEvent: true,
            createEvent: new Date().toLocaleString(),
        });
    } catch (error) {
        console.error('Error al crear evento unificado:', error);
    }
}

// Enviar notificación de reserva
async function enviarNotificacionReserva(tipo, reserva, accion) {
    try {
        // Integración con el sistema de notificaciones
        const mensajes = {
            created: `Tu reserva de ${tipo} ha sido creada exitosamente`,
            modified: `Tu reserva de ${tipo} ha sido modificada`,
            cancelled: `Tu reserva de ${tipo} ha sido cancelada`
        };

        // Aquí se llamaría al controller de notificaciones
        console.log(`Notificación: ${mensajes[accion]} - Reserva ID: ${reserva.id}`);
    } catch (error) {
        console.error('Error al enviar notificación:', error);
    }
}

reservationsCtl.confirmarReserva = async (req, res) => {
    try {
        const { tipo, id } = req.params;
        const { metodoPago, transactionId } = req.body;

        if (!['cinema', 'concert', 'transport'].includes(tipo)) {
            return res.status(400).json({ message: 'Tipo de reserva inválido' });
        }

        let tabla, campoId, campoEstado;

        switch (tipo) {
            case 'cinema':
                tabla = 'reservations';
                campoId = 'idReservation';
                campoEstado = 'stateReservation';
                break;
            case 'concert':
                tabla = 'concertReservations';
                campoId = 'idConcertReservation';
                campoEstado = 'statusReservation';
                break;
            case 'transport':
                tabla = 'transportReservations';
                campoId = 'idTransportReservation';
                campoEstado = 'statusReservation';
                break;
        }

        const [reserva] = await sql.promise().query(
            `SELECT * FROM ${tabla} WHERE ${campoId} = ?`,
            [id]
        );

        if (reserva.length === 0) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        await sql.promise().query(
            `UPDATE ${tabla} SET ${campoEstado} = 'Confirmed', update${tabla} = ?, paymentMethod = ?, transactionId = ? WHERE ${campoId} = ?`,
            [new Date().toLocaleString(), metodoPago || null, transactionId || null, id]
        );

        return res.json({ message: 'Reserva confirmada exitosamente' });

    } catch (error) {
        console.error('Error al confirmar reserva:', error);
        return res.status(500).json({ message: 'Error al confirmar reserva', error: error.message });
    }
};


reservationsCtl.agregarListaEspera = async (req, res) => {
    try {
        const { usuarioId, tipo, resourceId, cantidad, contactInfo } = req.body;

        if (!['cinema', 'concert', 'transport'].includes(tipo)) {
            return res.status(400).json({ message: 'Tipo inválido' });
        }

        // Guardar en tabla ficticia lista_espera (debes crearla si no existe)
        await sql.promise().query(
            `INSERT INTO lista_espera (usuarioId, tipo, resourceId, cantidad, contactInfo, fechaSolicitud) VALUES (?, ?, ?, ?, ?, ?)`,
            [usuarioId, tipo, resourceId, cantidad, JSON.stringify(contactInfo || {}), new Date()]
        );

        return res.status(201).json({ message: 'Agregado a la lista de espera correctamente' });
    } catch (error) {
        console.error('Error al agregar a lista de espera:', error);
        return res.status(500).json({ message: 'Error interno al agregar a la lista de espera', error: error.message });
    }
};

reservationsCtl.obtenerHistorialReserva = async (req, res) => {
    try {
        const { tipo, id } = req.params;

        if (!['cinema', 'concert', 'transport'].includes(tipo)) {
            return res.status(400).json({ message: 'Tipo inválido' });
        }

        // Simulación de historial — puedes reemplazar con una tabla real si la tienes
        const historial = [
            { accion: 'creado', fecha: '2024-06-01 10:00', usuario: 'sistema' },
            { accion: 'confirmado', fecha: '2024-06-01 10:05', usuario: 'usuario' }
        ];

        return res.json({ historial });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        return res.status(500).json({ message: 'Error al obtener historial', error: error.message });
    }
};

reservationsCtl.validarCodigoReserva = async (req, res) => {
    try {
        const { codigo } = req.params;

        // Buscar en las tres tablas posibles
        const [cine] = await sql.promise().query(
            'SELECT * FROM reservations WHERE codeReservation = ?',
            [codigo]
        );

        const [concert] = await sql.promise().query(
            'SELECT * FROM concertReservations WHERE reservationCode = ?',
            [codigo]
        );

        const [transport] = await sql.promise().query(
            'SELECT * FROM transportReservations WHERE reservationCode = ?',
            [codigo]
        );

        if (cine.length > 0) return res.json({ valido: true, tipo: 'cinema', data: cine[0] });
        if (concert.length > 0) return res.json({ valido: true, tipo: 'concert', data: concert[0] });
        if (transport.length > 0) return res.json({ valido: true, tipo: 'transport', data: transport[0] });

        return res.status(404).json({ valido: false, message: 'Código no encontrado' });

    } catch (error) {
        console.error('Error al validar código:', error);
        return res.status(500).json({ message: 'Error al validar código', error: error.message });
    }
};


module.exports = reservationsCtl;