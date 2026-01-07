const detalleRolCtl = {};
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

// Mostrar todas las relaciones usuario-rol activas
detalleRolCtl.mostrarRelaciones = async (req, res) => {
    try {
        const [listaRelaciones] = await sql.promise().query(`
            SELECT dr.*, u.nameUsers, u.emailUser, u.userName, r.nameRol, r.descriptionRol
            FROM detallerols dr
            JOIN users u ON dr.userIdUser = u.idUser
            JOIN roles r ON dr.roleIdRol = r.idRol
            WHERE u.stateUser = 'active' AND r.stateRol = 'activo'
            ORDER BY dr.createDetalleRol DESC
        `);

        const relacionesCompletas = listaRelaciones.map(relacion => ({
            ...relacion,
            nameUsers: descifrarSeguro(relacion.nameUsers),
            emailUser: descifrarSeguro(relacion.emailUser),
            userName: descifrarSeguro(relacion.userName),
            nameRol: descifrarSeguro(relacion.nameRol),
            descriptionRol: descifrarSeguro(relacion.descriptionRol)
        }));

        return res.json(relacionesCompletas);
    } catch (error) {
        console.error('Error al mostrar relaciones:', error);
        return res.status(500).json({ message: 'Error al obtener las relaciones', error: error.message });
    }
};

// Obtener roles de un usuario específico
detalleRolCtl.obtenerRolesUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        // Verificar que el usuario existe
        const [usuario] = await sql.promise().query(
            'SELECT idUser, nameUsers, emailUser FROM users WHERE idUser = ? AND stateUser = "active"',
            [usuarioId]
        );

        if (usuario.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const [rolesUsuario] = await sql.promise().query(`
            SELECT r.*, dr.createDetalleRol, dr.idDetalleRol
            FROM detallerols dr
            JOIN roles r ON dr.roleIdRol = r.idRol
            WHERE dr.userIdUser = ? AND r.stateRol = 'activo'
            ORDER BY dr.createDetalleRol DESC
        `, [usuarioId]);

        const resultado = {
            usuario: {
                ...usuario[0],
                nameUsers: descifrarSeguro(usuario[0].nameUsers),
                emailUser: descifrarSeguro(usuario[0].emailUser)
            },
            roles: rolesUsuario.map(rol => ({
                ...rol,
                nameRol: descifrarSeguro(rol.nameRol),
                descriptionRol: descifrarSeguro(rol.descriptionRol)
            }))
        };

        return res.json(resultado);
    } catch (error) {
        console.error('Error al obtener roles del usuario:', error);
        return res.status(500).json({ message: 'Error al obtener roles', error: error.message });
    }
};

// Obtener usuarios con un rol específico
detalleRolCtl.obtenerUsuariosRol = async (req, res) => {
    try {
        const { rolId } = req.params;

        // Verificar que el rol existe
        const [rol] = await sql.promise().query(
            'SELECT idRol, nameRol, descriptionRol FROM roles WHERE idRol = ? AND stateRol = "activo"',
            [rolId]
        );

        if (rol.length === 0) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        const [usuariosRol] = await sql.promise().query(`
            SELECT u.*, dr.createDetalleRol, dr.idDetalleRol
            FROM detallerols dr
            JOIN users u ON dr.userIdUser = u.idUser
            WHERE dr.roleIdRol = ? AND u.stateUser = 'active'
            ORDER BY dr.createDetalleRol DESC
        `, [rolId]);

        const resultado = {
            rol: {
                ...rol[0],
                nameRol: descifrarSeguro(rol[0].nameRol),
                descriptionRol: descifrarSeguro(rol[0].descriptionRol)
            },
            usuarios: usuariosRol.map(usuario => ({
                ...usuario,
                nameUsers: descifrarSeguro(usuario.nameUsers),
                phoneUser: descifrarSeguro(usuario.phoneUser),
                emailUser: descifrarSeguro(usuario.emailUser),
                userName: descifrarSeguro(usuario.userName),
                passwordUser: undefined // No incluir contraseña
            }))
        };

        return res.json(resultado);
    } catch (error) {
        console.error('Error al obtener usuarios del rol:', error);
        return res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
    }
};

// Asignar múltiples roles a un usuario
detalleRolCtl.asignarMultiplesRoles = async (req, res) => {
    try {
        const { usuarioId, roles } = req.body;

        if (!usuarioId || !roles || !Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({ message: 'Usuario y array de roles son obligatorios' });
        }

        // Verificar que el usuario existe
        const [usuario] = await sql.promise().query(
            'SELECT idUser FROM users WHERE idUser = ? AND stateUser = "active"',
            [usuarioId]
        );

        if (usuario.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar que todos los roles existen
        const placeholders = roles.map(() => '?').join(',');
        const [rolesExistentes] = await sql.promise().query(
            `SELECT idRol FROM roles WHERE idRol IN (${placeholders}) AND stateRol = 'activo'`,
            roles
        );

        if (rolesExistentes.length !== roles.length) {
            return res.status(400).json({ message: 'Uno o más roles no existen o están inactivos' });
        }

        let rolesAsignados = 0;
        let rolesDuplicados = 0;

        for (const rolId of roles) {
            // Verificar si ya existe la relación
            const [relacionExiste] = await sql.promise().query(
                'SELECT idDetalleRol FROM detallerols WHERE userIdUser = ? AND roleIdRol = ?',
                [usuarioId, rolId]
            );

            if (relacionExiste.length === 0) {
                // Crear usando SQL directo para evitar problemas con el ORM
                await sql.promise().query(
                    'INSERT INTO detallerols (userIdUser, roleIdRol, createDetalleRol) VALUES (?, ?, ?)',
                    [usuarioId, rolId, new Date().toLocaleString()]
                );
                rolesAsignados++;
            } else {
                rolesDuplicados++;
            }
        }

        return res.status(201).json({ 
            message: `Proceso completado. ${rolesAsignados} roles asignados, ${rolesDuplicados} roles ya existían.`
        });

    } catch (error) {
        console.error('Error al asignar múltiples roles:', error);
        return res.status(500).json({ message: 'Error al asignar roles', error: error.message });
    }
};

// Asignar rol a múltiples usuarios
detalleRolCtl.asignarRolMultiplesUsuarios = async (req, res) => {
    try {
        const { rolId, usuarios } = req.body;

        if (!rolId || !usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
            return res.status(400).json({ message: 'Rol y array de usuarios son obligatorios' });
        }

        // Verificar que el rol existe
        const [rol] = await sql.promise().query(
            'SELECT idRol FROM roles WHERE idRol = ? AND stateRol = "activo"',
            [rolId]
        );

        if (rol.length === 0) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        // Verificar que todos los usuarios existen
        const placeholders = usuarios.map(() => '?').join(',');
        const [usuariosExistentes] = await sql.promise().query(
            `SELECT idUser FROM users WHERE idUser IN (${placeholders}) AND stateUser = 'active'`,
            usuarios
        );

        if (usuariosExistentes.length !== usuarios.length) {
            return res.status(400).json({ message: 'Uno o más usuarios no existen o están inactivos' });
        }

        let asignacionesRealizadas = 0;
        let asignacionesDuplicadas = 0;

        for (const usuarioId of usuarios) {
            // Verificar si ya existe la relación
            const [relacionExiste] = await sql.promise().query(
                'SELECT idDetalleRol FROM detallerols WHERE userIdUser = ? AND roleIdRol = ?',
                [usuarioId, rolId]
            );

            if (relacionExiste.length === 0) {
                // Crear usando SQL directo
                await sql.promise().query(
                    'INSERT INTO detallerols (userIdUser, roleIdRol, createDetalleRol) VALUES (?, ?, ?)',
                    [usuarioId, rolId, new Date().toLocaleString()]
                );
                asignacionesRealizadas++;
            } else {
                asignacionesDuplicadas++;
            }
        }

        return res.status(201).json({ 
            message: `Proceso completado. ${asignacionesRealizadas} asignaciones realizadas, ${asignacionesDuplicadas} ya existían.`
        });

    } catch (error) {
        console.error('Error al asignar rol a múltiples usuarios:', error);
        return res.status(500).json({ message: 'Error al asignar rol', error: error.message });
    }
};

// Remover múltiples roles de un usuario
detalleRolCtl.removerMultiplesRoles = async (req, res) => {
    try {
        const { usuarioId, roles } = req.body;

        if (!usuarioId || !roles || !Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({ message: 'Usuario y array de roles son obligatorios' });
        }

        const placeholders = roles.map(() => '?').join(',');
        const params = [usuarioId, ...roles];
        
        const resultado = await sql.promise().query(
            `DELETE FROM detallerols WHERE userIdUser = ? AND roleIdRol IN (${placeholders})`,
            params
        );

        return res.json({ 
            message: `${resultado[0].affectedRows} roles removidos exitosamente`
        });

    } catch (error) {
        console.error('Error al remover múltiples roles:', error);
        return res.status(500).json({ message: 'Error al remover roles', error: error.message });
    }
};

// Remover rol de múltiples usuarios
detalleRolCtl.removerRolMultiplesUsuarios = async (req, res) => {
    try {
        const { rolId, usuarios } = req.body;

        if (!rolId || !usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
            return res.status(400).json({ message: 'Rol y array de usuarios son obligatorios' });
        }

        const placeholders = usuarios.map(() => '?').join(',');
        const params = [rolId, ...usuarios];
        
        const resultado = await sql.promise().query(
            `DELETE FROM detallerols WHERE roleIdRol = ? AND userIdUser IN (${placeholders})`,
            params
        );

        return res.json({ 
            message: `Rol removido de ${resultado[0].affectedRows} usuarios exitosamente`
        });

    } catch (error) {
        console.error('Error al remover rol de múltiples usuarios:', error);
        return res.status(500).json({ message: 'Error al remover rol', error: error.message });
    }
};

// Obtener estadísticas de relaciones usuario-rol
detalleRolCtl.obtenerEstadisticas = async (req, res) => {
    try {
        // Estadísticas generales
        const [estadisticasGenerales] = await sql.promise().query(`
            SELECT 
                COUNT(DISTINCT dr.userIdUser) as usuariosConRoles,
                COUNT(DISTINCT dr.roleIdRol) as rolesAsignados,
                COUNT(*) as totalRelaciones,
                AVG(conteoRoles.cantidadRoles) as promedioRolesPorUsuario
            FROM detallerols dr
            JOIN users u ON dr.userIdUser = u.idUser AND u.stateUser = 'active'
            JOIN roles r ON dr.roleIdRol = r.idRol AND r.stateRol = 'activo'
            JOIN (
                SELECT userIdUser, COUNT(*) as cantidadRoles
                FROM detallerols dr2
                JOIN users u2 ON dr2.userIdUser = u2.idUser AND u2.stateUser = 'active'
                JOIN roles r2 ON dr2.roleIdRol = r2.idRol AND r2.stateRol = 'activo'
                GROUP BY userIdUser
            ) conteoRoles ON dr.userIdUser = conteoRoles.userIdUser
        `);

        // Usuarios sin roles
        const [usuariosSinRoles] = await sql.promise().query(`
            SELECT COUNT(*) as usuariosSinRoles
            FROM users u
            LEFT JOIN detallerols dr ON u.idUser = dr.userIdUser
            WHERE u.stateUser = 'active' AND dr.userIdUser IS NULL
        `);

        // Roles no asignados
        const [rolesNoAsignados] = await sql.promise().query(`
            SELECT COUNT(*) as rolesNoAsignados
            FROM roles r
            LEFT JOIN detallerols dr ON r.idRol = dr.roleIdRol
            WHERE r.stateRol = 'activo' AND dr.roleIdRol IS NULL
        `);

        // Top 5 usuarios con más roles
        const [usuariosConMasRoles] = await sql.promise().query(`
            SELECT u.nameUsers, u.emailUser, COUNT(dr.roleIdRol) as cantidadRoles
            FROM users u
            JOIN detallerols dr ON u.idUser = dr.userIdUser
            JOIN roles r ON dr.roleIdRol = r.idRol AND r.stateRol = 'activo'
            WHERE u.stateUser = 'active'
            GROUP BY u.idUser
            ORDER BY cantidadRoles DESC
            LIMIT 5
        `);

        return res.json({
            estadisticasGenerales: {
                ...estadisticasGenerales[0],
                usuariosSinRoles: usuariosSinRoles[0].usuariosSinRoles,
                rolesNoAsignados: rolesNoAsignados[0].rolesNoAsignados
            },
            usuariosConMasRoles: usuariosConMasRoles.map(usuario => ({
                ...usuario,
                nameUsers: descifrarSeguro(usuario.nameUsers),
                emailUser: descifrarSeguro(usuario.emailUser)
            }))
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// Validar relación usuario-rol
detalleRolCtl.validarRelacion = async (req, res) => {
    try {
        const { usuarioId, rolId } = req.params;

        const [relacion] = await sql.promise().query(`
            SELECT dr.*, u.nameUsers, r.nameRol
            FROM detallerols dr
            JOIN users u ON dr.userIdUser = u.idUser
            JOIN roles r ON dr.roleIdRol = r.idRol
            WHERE dr.userIdUser = ? AND dr.roleIdRol = ? 
            AND u.stateUser = 'active' AND r.stateRol = 'activo'
        `, [usuarioId, rolId]);

        if (relacion.length === 0) {
            return res.status(404).json({ 
                message: 'Relación no encontrada o usuario/rol inactivos',
                existe: false 
            });
        }

        return res.json({
            existe: true,
            relacion: {
                ...relacion[0],
                nameUsers: descifrarSeguro(relacion[0].nameUsers),
                nameRol: descifrarSeguro(relacion[0].nameRol)
            }
        });
    } catch (error) {
        console.error('Error al validar relación:', error);
        return res.status(500).json({ message: 'Error en validación', error: error.message });
    }
};

module.exports = detalleRolCtl;