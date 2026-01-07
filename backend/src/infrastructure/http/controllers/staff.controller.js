const staffCtl = {};
const orm = require('../../../infrastructure/database/connection/dataBase.orm');
const sql = require('../../../infrastructure/database/connection/dataBase.sql');
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

// ================ GESTIÓN DE PERSONAL ================

// Mostrar todo el personal activo
staffCtl.mostrarStaff = async (req, res) => {
    try {
        const { department, position, status, page = 1, limit = 20 } = req.query;
        
        let query = `
            SELECT s.*, u.nameUsers, u.emailUser , u.userName,
                   COUNT(sa.idStaffAssignment) as asignacionesActivas
            FROM staffs s
            LEFT JOIN users u ON s.usuarioId = u.idUser 
            LEFT JOIN staffAssignments sa ON s.idStaff = sa.staffId 
                AND sa.stateAssignment = 1 
                AND sa.statusAssignment IN ('scheduled', 'in_progress')
            WHERE s.stateStaff = 1
        `;

        const params = [];

        if (department) {
            query += ' AND s.departmentStaff = ?';
            params.push(department);
        }

        if (position) {
            query += ' AND s.positionStaff LIKE ?';
            params.push(`%${position}%`);
        }

        if (status) {
            query += ' AND s.statusStaff = ?';
            params.push(status);
        }

        query += ' GROUP BY s.idStaff ORDER BY s.createStaff DESC';

        // Paginación
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [listaStaff] = await sql.promise().query(query, params);

        const staffCompleto = listaStaff.map(staff => ({
            ...staff,
            nameStaff: descifrarSeguro(staff.nameStaff),
            emailStaff: descifrarSeguro(staff.emailStaff),
            phoneStaff: descifrarSeguro(staff.phoneStaff),
            nameUsers: descifrarSeguro(staff.nameUsers),
            emailUser:  descifrarSeguro(staff.emailUser ),
            userName: descifrarSeguro(staff.userName),
            workSchedule: staff.workSchedule ? JSON.parse(staff.workSchedule) : {},
            permissions: staff.permissions ? JSON.parse(staff.permissions) : {},
            asignacionesActivas: staff.asignacionesActivas || 0
        }));

        // Contar total para paginación
        let countQuery = query.replace(/SELECT s\.\*, u\.nameUsers.*?GROUP BY s\.idStaff/, 'SELECT COUNT(DISTINCT s.idStaff) as total FROM staffs s LEFT JOIN users u ON s.usuarioId = u.idUser  LEFT JOIN staffAssignments sa ON s.idStaff = sa.staffId AND sa.stateAssignment = 1 AND sa.statusAssignment IN (\'scheduled\', \'in_progress\')');
        countQuery = countQuery.replace(/ORDER BY.*?LIMIT.*?OFFSET.*?$/, '');
        const countParams = params.slice(0, -2);

        const [totalCount] = await sql.promise().query(countQuery, countParams);

        return res.json({
            staff: staffCompleto,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount[0].total / parseInt(limit)),
                totalRecords: totalCount[0].total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al mostrar staff:', error);
        return res.status(500).json({ message: 'Error al obtener el personal', error: error.message });
    }
};

// Crear nuevo miembro del staff
staffCtl.crearStaff = async (req, res) => {
    try {
        const { 
            usuarioId, nameStaff, emailStaff, phoneStaff, positionStaff,
            departmentStaff, hireDate, salaryStaff, workSchedule, permissions,
            statusStaff
        } = req.body;

        // Validaciones
        if (!nameStaff || !emailStaff || !positionStaff || !departmentStaff) {
            return res.status(400).json({ 
                message: 'Nombre, email, puesto y departamento son obligatorios' 
            });
        }

        // Verificar si el usuario existe (si se proporciona)
        if (usuarioId) {
            const [usuarioExiste] = await sql.promise().query(
                'SELECT idUser  FROM users WHERE idUser  = ? AND stateUser  = "active"',
                [usuarioId]
            );

            if (usuarioExiste.length === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
        }

        // Verificar si el email ya existe
        const [emailExiste] = await sql.promise().query(
            'SELECT idStaff FROM staffs WHERE emailStaff = ? AND stateStaff = 1',
            [cifrarDatos(emailStaff)]
        );

        if (emailExiste.length > 0) {
            return res.status(400).json({ message: 'Ya existe personal con este email' });
        }

        // Crear staff
        const nuevoStaff = await orm.Staff.create({
            usuarioId: usuarioId || null,
            nameStaff: cifrarDatos(nameStaff),
            emailStaff: cifrarDatos(emailStaff),
            phoneStaff: cifrarDatos(phoneStaff || ''),
            positionStaff: positionStaff,
            departmentStaff: departmentStaff,
            hireDate: hireDate ? new Date(hireDate) : new Date(),
            salaryStaff: parseFloat(salaryStaff) || 0,
            workSchedule: workSchedule ? JSON.stringify(workSchedule) : JSON.stringify({}),
            permissions: permissions ? JSON.stringify(permissions) : JSON.stringify({}),
            statusStaff: statusStaff || 'active',
            stateStaff: true,
            createStaff: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Personal creado exitosamente',
            idStaff: nuevoStaff.idStaff,
            staff: {
                id: nuevoStaff.idStaff,
                nombre: nameStaff,
                email: emailStaff,
                puesto: positionStaff,
                departamento: departmentStaff,
                estado: statusStaff || 'active'
            }
        });

    } catch (error) {
        console.error('Error al crear staff:', error);
        return res.status(500).json({ 
            message: 'Error al crear el personal', 
            error: error.message 
        });
    }
};

// Obtener staff por ID
staffCtl.obtenerStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const [staff] = await sql.promise().query(`
            SELECT s.*, u.nameUsers, u.emailUser , u.userName
            FROM staffs s
            LEFT JOIN users u ON s.usuarioId = u.idUser 
            WHERE s.idStaff = ? AND s.stateStaff = 1
        `, [id]);

        if (staff.length === 0) {
            return res.status(404).json({ message: 'Personal no encontrado' });
        }

        const staffData = staff[0];

        // Obtener asignaciones del staff
        const [asignaciones] = await sql.promise().query(`
            SELECT sa.*, 
                   CASE 
                       WHEN sa.assignmentType = 'cinema' THEN c.nameCinema
                       WHEN sa.assignmentType = 'concert' THEN cv.nameVenue
                       WHEN sa.assignmentType = 'transport' THEN tc.nameCompany
                       ELSE 'General'
                   END as locationName
            FROM staffAssignments sa
            LEFT JOIN cinemas c ON sa.locationId = c.idCinema AND sa.assignmentType = 'cinema'
            LEFT JOIN concertVenues cv ON sa.locationId = cv.idConcertVenue AND sa.assignmentType = 'concert'
            LEFT JOIN transportCompanies tc ON sa.locationId = tc.idTransportCompany AND sa.assignmentType = 'transport'
            WHERE sa.staffId = ? AND sa.stateAssignment = 1
            ORDER BY sa.assignmentDate DESC
        `, [id]);

        const staffCompleto = {
            ...staffData,
            nameStaff: descifrarSeguro(staffData.nameStaff),
            emailStaff: descifrarSeguro(staffData.emailStaff),
            phoneStaff: descifrarSeguro(staffData.phoneStaff),
            nameUsers: descifrarSeguro(staffData.nameUsers),
            emailUser:  descifrarSeguro(staffData.emailUser ),
            userName: descifrarSeguro(staffData.userName),
            workSchedule: staffData.workSchedule ? JSON.parse(staffData.workSchedule) : {},
            permissions: staffData.permissions ? JSON.parse(staffData.permissions) : {},
            asignaciones: asignaciones.map(asignacion => ({
                ...asignacion,
                locationAssignment: descifrarSeguro(asignacion.locationAssignment),
                locationName: descifrarSeguro(asignacion.locationName)
            }))
        };

        return res.json(staffCompleto);

    } catch (error) {
        console.error('Error al obtener staff:', error);
        return res.status(500).json({ message: 'Error al obtener personal', error: error.message });
    }
};

// Actualizar staff
staffCtl.actualizarStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nameStaff, emailStaff, phoneStaff, positionStaff,
            departmentStaff, salaryStaff, workSchedule, permissions,
            statusStaff
        } = req.body;

        // Verificar que el staff existe
        const [staffExiste] = await sql.promise().query(
            'SELECT idStaff FROM staffs WHERE idStaff = ? AND stateStaff = 1',
            [id]
        );

        if (staffExiste.length === 0) {
            return res.status(404).json({ message: 'Personal no encontrado' });
        }

        // Verificar email duplicado (excluyendo el actual)
        if (emailStaff) {
            const [emailExiste] = await sql.promise().query(
                'SELECT idStaff FROM staffs WHERE emailStaff = ? AND idStaff != ? AND stateStaff = 1',
                [cifrarDatos(emailStaff), id]
            );

            if (emailExiste.length > 0) {
                return res.status(400).json({ message: 'Ya existe personal con este email' });
            }
        }

        // Actualizar staff
        await sql.promise().query(
            `UPDATE staffs SET 
                nameStaff = COALESCE(?, nameStaff),
                emailStaff = COALESCE(?, emailStaff),
                phoneStaff = COALESCE(?, phoneStaff),
                positionStaff = COALESCE(?, positionStaff),
                departmentStaff = COALESCE(?, departmentStaff),
                salaryStaff = COALESCE(?, salaryStaff),
                workSchedule = COALESCE(?, workSchedule),
                permissions = COALESCE(?, permissions),
                statusStaff = COALESCE(?, statusStaff),
                updateStaff = ?
             WHERE idStaff = ?`,
            [
                nameStaff ? cifrarDatos(nameStaff) : null,
                emailStaff ? cifrarDatos(emailStaff) : null,
                phoneStaff ? cifrarDatos(phoneStaff) : null,
                positionStaff || null,
                departmentStaff || null,
                salaryStaff ? parseFloat(salaryStaff) : null,
                workSchedule ? JSON.stringify(workSchedule) : null,
                permissions ? JSON.stringify(permissions) : null,
                statusStaff || null,
                new Date().toLocaleString(),
                id
            ]
        );

        return res.json({ message: 'Personal actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar staff:', error);
        return res.status(500).json({ message: 'Error al actualizar personal', error: error.message });
    }
};

// Cambiar estado del staff
staffCtl.cambiarEstadoStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusStaff } = req.body;

        if (!statusStaff || !['active', 'inactive', 'on_leave', 'terminated'].includes(statusStaff)) {
            return res.status(400).json({ 
                message: 'Estado inválido. Use: active, inactive, on_leave, terminated' 
            });
        }

        await sql.promise().query(
            'UPDATE staffs SET statusStaff = ?, updateStaff = ? WHERE idStaff = ?',
            [statusStaff, new Date().toLocaleString(), id]
        );

        return res.json({ message: `Estado del personal cambiado a ${statusStaff} exitosamente` });

    } catch (error) {
        console.error('Error al cambiar estado:', error);
        return res.status(500).json({ message: 'Error al cambiar estado', error: error.message });
    }
};

// ================ GESTIÓN DE ASIGNACIONES ================

// Obtener asignaciones de staff
staffCtl.obtenerAsignaciones = async (req, res) => {
    try {
        const { staffId, assignmentType, status, startDate, endDate } = req.query;

        let query = `
            SELECT sa.*, s.nameStaff, s.positionStaff,
                   CASE 
                       WHEN sa.assignmentType = 'cinema' THEN c.nameCinema
                       WHEN sa.assignmentType = 'concert' THEN cv.nameVenue
                       WHEN sa.assignmentType = 'transport' THEN tc.nameCompany
                       ELSE 'General'
                   END as locationName
            FROM staffAssignments sa
            JOIN staffs s ON sa.staffId = s.idStaff
            LEFT JOIN cinemas c ON sa.locationId = c.idCinema AND sa.assignmentType = 'cinema'
            LEFT JOIN concertVenues cv ON sa.locationId = cv.idConcertVenue AND sa.assignmentType = 'concert'
            LEFT JOIN transportCompanies tc ON sa.locationId = tc.idTransportCompany AND sa.assignmentType = 'transport'
            WHERE sa.stateAssignment = 1
        `;

        const params = [];

        if (staffId) {
            query += ' AND sa.staffId = ?';
            params.push(staffId);
        }

        if (assignmentType) {
            query += ' AND sa.assignmentType = ?';
            params.push(assignmentType);
        }

        if (status) {
            query += ' AND sa.statusAssignment = ?';
            params.push(status);
        }

        if (startDate) {
            query += ' AND DATE(sa.assignmentDate) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(sa.assignmentDate) <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY sa.assignmentDate DESC';

        const [asignaciones] = await sql.promise().query(query, params);

        const asignacionesCompletas = asignaciones.map(asignacion => ({
            ...asignacion,
            nameStaff: descifrarSeguro(asignacion.nameStaff),
            locationAssignment: descifrarSeguro(asignacion.locationAssignment),
            locationName: descifrarSeguro(asignacion.locationName)
        }));

        return res.json(asignacionesCompletas);

    } catch (error) {
        console.error('Error al obtener asignaciones:', error);
        return res.status(500).json({ message: 'Error al obtener asignaciones', error: error.message });
    }
};

// Crear nueva asignación
staffCtl.crearAsignacion = async (req, res) => {
    try {
        const { 
            staffId, assignmentType, assignmentDate, startTime, endTime,
            locationId, locationAssignment, responsibilitiesAssignment
        } = req.body;

        // Validaciones
        if (!staffId || !assignmentType || !assignmentDate || !startTime || !endTime) {
            return res.status(400).json({ 
                message: 'Staff, tipo, fecha, hora inicio y hora fin son obligatorios' 
            });
        }

        if (!['cinema', 'concert', 'transport', 'general'].includes(assignmentType)) {
            return res.status(400).json({ message: 'Tipo de asignación inválido' });
        }

        // Verificar que el staff existe y está activo
        const [staffExiste] = await sql.promise().query(
            'SELECT idStaff, statusStaff FROM staffs WHERE idStaff = ? AND stateStaff = 1',
            [staffId]
        );

        if (staffExiste.length === 0) {
            return res.status(404).json({ message: 'Personal no encontrado' });
        }

        if (staffExiste[0].statusStaff !== 'active') {
            return res.status(400).json({ message: 'El personal no está activo' });
        }

        // Verificar conflictos de horario
        const [conflictoHorario] = await sql.promise().query(`
            SELECT idStaffAssignment FROM staffAssignments 
            WHERE staffId = ? 
            AND stateAssignment = 1 
            AND statusAssignment IN ('scheduled', 'in_progress')
            AND DATE(assignmentDate) = DATE(?)
            AND (
                (TIME(?) BETWEEN startTime AND endTime) OR
                (TIME(?) BETWEEN startTime AND endTime) OR
                (startTime BETWEEN TIME(?) AND TIME(?)) OR
                (endTime BETWEEN TIME(?) AND TIME(?))
            )
        `, [staffId, assignmentDate, startTime, endTime, startTime, endTime, startTime, endTime]);

        if (conflictoHorario.length > 0) {
            return res.status(400).json({ 
                message: 'El personal ya tiene una asignación en ese horario' 
            });
        }

        // Crear asignación
        const nuevaAsignacion = await orm.StaffAssignment.create({
            staffId: parseInt(staffId),
            assignmentType: assignmentType,
            assignmentDate: new Date(assignmentDate),
            startTime: startTime,
            endTime: endTime,
            locationId: locationId || null,
            locationAssignment: cifrarDatos(locationAssignment || ''),
            responsibilitiesAssignment: responsibilitiesAssignment || '',
            statusAssignment: 'scheduled',
            stateAssignment: true,
            createAssignment: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Asignación creada exitosamente',
            idAssignment: nuevaAsignacion.idStaffAssignment,
            asignacion: {
                id: nuevaAsignacion.idStaffAssignment,
                staffId: staffId,
                tipo: assignmentType,
                fecha: assignmentDate,
                horario: `${startTime} - ${endTime}`,
                estado: 'scheduled'
            }
        });

    } catch (error) {
        console.error('Error al crear asignación:', error);
        return res.status(500).json({ 
            message: 'Error al crear la asignación', 
            error: error.message 
        });
    }
};

// Actualizar estado de asignación
staffCtl.actualizarEstadoAsignacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusAssignment } = req.body;

        if (!statusAssignment || !['scheduled', 'in_progress', 'completed', 'cancelled'].includes(statusAssignment)) {
            return res.status(400).json({ 
                message: 'Estado inválido. Use: scheduled, in_progress, completed, cancelled' 
            });
        }

        await sql.promise().query(
            'UPDATE staffAssignments SET statusAssignment = ?, updateAssignment = ? WHERE idStaffAssignment = ?',
            [statusAssignment, new Date().toLocaleString(), id]
        );

        return res.json({ message: `Estado de asignación actualizado a ${statusAssignment}` });

    } catch (error) {
        console.error('Error al actualizar estado de asignación:', error);
        return res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
    }
};

// ================ REPORTES Y ESTADÍSTICAS ================

// Obtener estadísticas de staff
staffCtl.obtenerEstadisticas = async (req, res) => {
    try {
        // Estadísticas generales
        const [estadisticasGenerales] = await sql.promise().query(`
            SELECT 
                COUNT(*) as totalStaff,
                COUNT(CASE WHEN statusStaff = 'active' THEN 1 END) as staffActivo,
                COUNT(CASE WHEN statusStaff = 'inactive' THEN 1 END) as staffInactivo,
                COUNT(CASE WHEN statusStaff = 'on_leave' THEN 1 END) as staffEnLicencia,
                COUNT(CASE WHEN statusStaff = 'terminated' THEN 1 END) as staffTerminado,
                AVG(salaryStaff) as salarioPromedio
            FROM staffs 
            WHERE stateStaff = 1
        `);

        // Staff por departamento
        const [staffPorDepartamento] = await sql.promise().query(`
            SELECT 
                departmentStaff as departamento,
                COUNT(*) as cantidad,
                COUNT(CASE WHEN statusStaff = 'active' THEN 1 END) as activos,
                AVG(salaryStaff) as salarioPromedio
            FROM staffs 
            WHERE stateStaff = 1
            GROUP BY departmentStaff
            ORDER BY cantidad DESC
        `);

        // Asignaciones por tipo
        const [asignacionesPorTipo] = await sql.promise().query(`
            SELECT 
                assignmentType as tipo,
                COUNT(*) as totalAsignaciones,
                COUNT(CASE WHEN statusAssignment = 'scheduled' THEN 1 END) as programadas,
                COUNT(CASE WHEN statusAssignment = 'in_progress' THEN 1 END) as enProceso,
                COUNT(CASE WHEN statusAssignment = 'completed' THEN 1 END) as completadas
            FROM staffAssignments sa
            WHERE sa.stateAssignment = 1
            GROUP BY assignmentType
        `);

        // Staff más activo (con más asignaciones)
        const [staffMasActivo] = await sql.promise().query(`
            SELECT s.nameStaff, s.positionStaff, s.departmentStaff,
                   COUNT(sa.idStaffAssignment) as totalAsignaciones
            FROM staffs s
            LEFT JOIN staffAssignments sa ON s.idStaff = sa.staffId AND sa.stateAssignment = 1
            WHERE s.stateStaff = 1
            GROUP BY s.idStaff
            ORDER BY totalAsignaciones DESC
            LIMIT 5
        `);

        return res.json({
            resumen: {
                ...estadisticasGenerales[0],
                salarioPromedio: parseFloat(estadisticasGenerales[0].salarioPromedio || 0).toFixed(2)
            },
            departamentos: staffPorDepartamento.map(dept => ({
                ...dept,
                salarioPromedio: parseFloat(dept.salarioPromedio || 0).toFixed(2)
            })),
            asignacionesPorTipo: asignacionesPorTipo,
            staffMasActivo: staffMasActivo.map(staff => ({
                ...staff,
                nameStaff: descifrarSeguro(staff.nameStaff)
            }))
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// Obtener horario de staff
staffCtl.obtenerHorarioStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { startDate, endDate } = req.query;

        let query = `
            SELECT sa.*, 
                   CASE 
                       WHEN sa.assignmentType = 'cinema' THEN c.nameCinema
                       WHEN sa.assignmentType = 'concert' THEN cv.nameVenue
                       WHEN sa.assignmentType = 'transport' THEN tc.nameCompany
                       ELSE 'General'
                   END as locationName
            FROM staffAssignments sa
            LEFT JOIN cinemas c ON sa.locationId = c.idCinema AND sa.assignmentType = 'cinema'
            LEFT JOIN concertVenues cv ON sa.locationId = cv.idConcertVenue AND sa.assignmentType = 'concert'
            LEFT JOIN transportCompanies tc ON sa.locationId = tc.idTransportCompany AND sa.assignmentType = 'transport'
            WHERE sa.staffId = ? AND sa.stateAssignment = 1
        `;

        const params = [staffId];

        if (startDate) {
            query += ' AND DATE(sa.assignmentDate) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(sa.assignmentDate) <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY sa.assignmentDate ASC, sa.startTime ASC';

        const [horario] = await sql.promise().query(query, params);

        const horarioCompleto = horario.map(asignacion => ({
            ...asignacion,
            locationAssignment: descifrarSeguro(asignacion.locationAssignment),
            locationName: descifrarSeguro(asignacion.locationName)
        }));

        return res.json(horarioCompleto);

    } catch (error) {
        console.error('Error al obtener horario:', error);
        return res.status(500).json({ message: 'Error al obtener horario', error: error.message });
    }
};

// Buscar staff
staffCtl.buscarStaff = async (req, res) => {
    try {
        const { q, department, position } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ message: 'Consulta debe tener al menos 2 caracteres' });
        }

        let query = `
            SELECT s.*, u.nameUsers
            FROM staffs s
            LEFT JOIN users u ON s.usuarioId = u.idUser
            WHERE s.stateStaff = 1 AND (
                s.nameStaff LIKE ? OR 
                s.emailStaff LIKE ? OR 
                s.positionStaff LIKE ?
            )
        `;

        const params = [`%${q}%`, `%${q}%`, `%${q}%`];

        if (department) {
            query += ' AND s.departmentStaff = ?';
            params.push(department);
        }

        if (position) {
            query += ' AND s.positionStaff LIKE ?';
            params.push(`%${position}%`);
        }

        query += ' LIMIT 20';

        const [resultados] = await sql.promise().query(query, params);

        const staffEncontrado = resultados.map(staff => ({
            ...staff,
            nameStaff: descifrarSeguro(staff.nameStaff),
            emailStaff: descifrarSeguro(staff.emailStaff),
            phoneStaff: descifrarSeguro(staff.phoneStaff),
            nameUsers: descifrarSeguro(staff.nameUsers)
        }));

        return res.json(staffEncontrado);

    } catch (error) {
        console.error('Error al buscar staff:', error);
        return res.status(500).json({ message: 'Error en la búsqueda', error: error.message });
    }
};

// Eliminar (desactivar) staff
staffCtl.eliminarStaff = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si tiene asignaciones activas
        const [asignacionesActivas] = await sql.promise().query(`
            SELECT COUNT(*) as total 
            FROM staffAssignments 
            WHERE staffId = ? 
            AND stateAssignment = 1 
            AND statusAssignment IN ('scheduled', 'in_progress')
        `, [id]);

        if (asignacionesActivas[0].total > 0) {
            return res.status(400).json({ 
                message: `No se puede eliminar. El personal tiene ${asignacionesActivas[0].total} asignación(es) activa(s)` 
            });
        }

        await sql.promise().query(
            'UPDATE staffs SET stateStaff = 0, updateStaff = ? WHERE idStaff = ?',
            [new Date().toLocaleString(), id]
        );

        return res.json({ message: 'Personal desactivado exitosamente' });

    } catch (error) {
        console.error('Error al eliminar staff:', error);
        return res.status(500).json({ message: 'Error al desactivar personal', error: error.message });
    }
};

module.exports = staffCtl;
