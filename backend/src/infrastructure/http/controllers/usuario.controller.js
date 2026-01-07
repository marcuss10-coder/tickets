const usuarioCtl = {};
const orm = require('../../../infrastructure/database/connection/dataBase.orm');
const sql = require('../../../infrastructure/database/connection/dataBase.sql');
const { cifrarDatos, descifrarDatos } = require('../../../application/encrypDates');
const bcrypt = require('bcrypt');

// Función para descifrar de forma segura
const descifrarSeguro = (dato) => {
    try {
        return dato ? descifrarDatos(dato) : '';
    } catch (error) {
        console.error('Error al descifrar:', error);
        return '';
    }
};

// Mostrar todos los usuarios activos con sus roles
usuarioCtl.mostrarUsuarios = async (req, res) => {
    try {
        const [listaUsuarios] = await sql.promise().query(`
            SELECT u.*, GROUP_CONCAT(DISTINCT r.nameRol SEPARATOR ', ') as roles
            FROM users u
            LEFT JOIN detallerols dr ON u.idUser = dr.userIdUser
            LEFT JOIN roles r ON dr.roleIdRol = r.idRol AND r.stateRol = 'activo'
            WHERE u.stateUser = 'active'
            GROUP BY u.idUser
            ORDER BY u.createUser DESC
        `);

        const usuariosCompletos = listaUsuarios.map(usuario => ({
            ...usuario,
            nameUsers: descifrarSeguro(usuario.nameUsers),
            phoneUser: descifrarSeguro(usuario.phoneUser),
            emailUser: descifrarSeguro(usuario.emailUser),
            userName: descifrarSeguro(usuario.userName),
            // No incluir la contraseña en la respuesta
            passwordUser: undefined,
            roles: usuario.roles || 'Sin roles asignados'
        }));

        return res.json(usuariosCompletos);
    } catch (error) {
        console.error('Error al mostrar usuarios:', error);
        return res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
    }
};

// Crear nuevo usuario
usuarioCtl.crearUsuario = async (req, res) => {
    try {
        const { nameUsers, phoneUser, emailUser, userName, passwordUser, roles } = req.body;

        // Validación de campos requeridos
        if (!nameUsers || !emailUser || !userName || !passwordUser) {
            return res.status(400).json({ message: 'Nombre, email, usuario y contraseña son obligatorios' });
        }

        // Verificar si el usuario ya existe
        const [usuarioExiste] = await sql.promise().query(
            'SELECT idUser FROM users WHERE userName = ? OR emailUser = ?',
            [cifrarDatos(userName), cifrarDatos(emailUser)]
        );

        if (usuarioExiste.length > 0) {
            return res.status(400).json({ message: 'Ya existe un usuario con este nombre de usuario o email' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(passwordUser, 10);

        // Crear usuario en SQL
        const nuevoUsuario = await orm.usuario.create({
            nameUsers: cifrarDatos(nameUsers),
            phoneUser: cifrarDatos(phoneUser || ''),
            emailUser: cifrarDatos(emailUser),
            userName: cifrarDatos(userName),
            passwordUser: hashedPassword,
            stateUser: 'active',
            createUser: new Date().toLocaleString(),
        });

        // Asignar roles si se proporcionan
        if (roles && Array.isArray(roles) && roles.length > 0) {
            for (const rolId of roles) {
                await orm.detalleRol.create({
                    userIdUser: nuevoUsuario.idUser,
                    roleIdRol: rolId,
                    createDetalleRol: new Date().toLocaleString()
                });
            }
        }

        return res.status(201).json({ 
            message: 'Usuario creado exitosamente',
            idUser: nuevoUsuario.idUser
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        return res.status(500).json({ 
            message: 'Error al crear el usuario', 
            error: error.message 
        });
    }
};

// Actualizar usuario
usuarioCtl.actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nameUsers, phoneUser, emailUser, userName, passwordUser, roles } = req.body;

        // Validar campos básicos
        if (!nameUsers || !emailUser || !userName) {
            return res.status(400).json({ message: 'Nombre, email y usuario son obligatorios' });
        }

        // Verificar si existe el usuario
        const [usuarioExiste] = await sql.promise().query(
            'SELECT idUser FROM users WHERE idUser = ? AND stateUser = "active"',
            [id]
        );

        if (usuarioExiste.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar si el nuevo userName o email ya existen (excluyendo el usuario actual)
        const [duplicado] = await sql.promise().query(
            'SELECT idUser FROM users WHERE (userName = ? OR emailUser = ?) AND idUser != ? AND stateUser = "active"',
            [cifrarDatos(userName), cifrarDatos(emailUser), id]
        );

        if (duplicado.length > 0) {
            return res.status(400).json({ message: 'Ya existe otro usuario con este nombre de usuario o email' });
        }

        // Preparar datos para actualizar
        let updateData = {
            nameUsers: cifrarDatos(nameUsers),
            phoneUser: cifrarDatos(phoneUser || ''),
            emailUser: cifrarDatos(emailUser),
            userName: cifrarDatos(userName),
            updateUser: new Date().toLocaleString()
        };

        // Si se proporciona nueva contraseña, encriptarla
        if (passwordUser) {
            updateData.passwordUser = await bcrypt.hash(passwordUser, 10);
        }

        // Actualizar usuario en SQL
        await sql.promise().query(
            `UPDATE users SET 
                nameUsers = ?, 
                phoneUser = ?, 
                emailUser = ?, 
                userName = ?, 
                ${passwordUser ? 'passwordUser = ?, ' : ''}
                updateUser = ? 
             WHERE idUser = ?`,
            passwordUser ? 
                [updateData.nameUsers, updateData.phoneUser, updateData.emailUser, updateData.userName, updateData.passwordUser, updateData.updateUser, id] :
                [updateData.nameUsers, updateData.phoneUser, updateData.emailUser, updateData.userName, updateData.updateUser, id]
        );

        // Actualizar roles si se proporcionan
        if (roles && Array.isArray(roles)) {
            // Eliminar roles existentes
            await sql.promise().query(
                'DELETE FROM detallerols WHERE userIdUser = ?',
                [id]
            );
            
            // Crear nuevas relaciones de roles
            for (const rolId of roles) {
                await orm.detalleRol.create({
                    userIdUser: id,
                    roleIdRol: rolId,
                    createDetalleRol: new Date().toLocaleString()
                });
            }
        }

        return res.json({ message: 'Usuario actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Eliminar (desactivar) usuario
usuarioCtl.eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el usuario existe
        const [usuarioExiste] = await sql.promise().query(
            'SELECT idUser FROM users WHERE idUser = ? AND stateUser = "active"',
            [id]
        );

        if (usuarioExiste.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Desactivar usuario
        await sql.promise().query(
            `UPDATE users SET 
                stateUser = 'inactive', 
                updateUser = ? 
             WHERE idUser = ?`,
            [new Date().toLocaleString(), id]
        );

        return res.json({ message: 'Usuario desactivado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        return res.status(500).json({ message: 'Error al desactivar', error: error.message });
    }
};

// Obtener usuario por ID con sus roles
usuarioCtl.obtenerUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [usuario] = await sql.promise().query(`
            SELECT u.* 
            FROM users u
            WHERE u.idUser = ? AND u.stateUser = "active"
        `, [id]);

        if (usuario.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Obtener roles del usuario
        const [rolesUsuario] = await sql.promise().query(`
            SELECT r.*, dr.createDetalleRol
            FROM detallerols dr
            JOIN roles r ON dr.roleIdRol = r.idRol
            WHERE dr.userIdUser = ? AND r.stateRol = 'activo'
        `, [id]);

        const usuarioCompleto = {
            ...usuario[0],
            nameUsers: descifrarSeguro(usuario[0].nameUsers),
            phoneUser: descifrarSeguro(usuario[0].phoneUser),
            emailUser: descifrarSeguro(usuario[0].emailUser),
            userName: descifrarSeguro(usuario[0].userName),
            // No incluir la contraseña
            passwordUser: undefined,
            roles: rolesUsuario.map(rol => ({
                ...rol,
                nameRol: descifrarSeguro(rol.nameRol),
                descriptionRol: descifrarSeguro(rol.descriptionRol)
            }))
        };

        return res.json(usuarioCompleto);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        return res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
    }
};

// Buscar usuarios por término
usuarioCtl.buscarUsuarios = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ message: 'Consulta debe tener al menos 2 caracteres' });
        }

        const [usuariosEncontrados] = await sql.promise().query(`
            SELECT u.*, GROUP_CONCAT(DISTINCT r.nameRol SEPARATOR ', ') as roles
            FROM users u
            LEFT JOIN detallerols dr ON u.idUser = dr.userIdUser
            LEFT JOIN roles r ON dr.roleIdRol = r.idRol AND r.stateRol = 'activo'
            WHERE u.stateUser = 'active' AND (
                u.nameUsers LIKE ? OR 
                u.emailUser LIKE ? OR 
                u.userName LIKE ?
            )
            GROUP BY u.idUser
            LIMIT 20
        `, [`%${q}%`, `%${q}%`, `%${q}%`]);

        const resultados = usuariosEncontrados.map(usuario => ({
            ...usuario,
            nameUsers: descifrarSeguro(usuario.nameUsers),
            phoneUser: descifrarSeguro(usuario.phoneUser),
            emailUser: descifrarSeguro(usuario.emailUser),
            userName: descifrarSeguro(usuario.userName),
            passwordUser: undefined,
            roles: usuario.roles || 'Sin roles'
        }));

        return res.json(resultados);
    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        return res.status(500).json({ message: 'Error en la búsqueda', error: error.message });
    }
};

// Asignar rol a usuario
usuarioCtl.asignarRol = async (req, res) => {
    try {
        const { usuarioId, rolId } = req.body;

        if (!usuarioId || !rolId) {
            return res.status(400).json({ message: 'Usuario y rol son obligatorios' });
        }

        // Verificar que el usuario y el rol existen
        const [usuario] = await sql.promise().query(
            'SELECT idUser FROM users WHERE idUser = ? AND stateUser = "active"',
            [usuarioId]
        );

        const [rol] = await sql.promise().query(
            'SELECT idRol FROM roles WHERE idRol = ? AND stateRol = "activo"',
            [rolId]
        );

        if (usuario.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (rol.length === 0) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        // Verificar si ya existe la relación
        const [relacionExiste] = await sql.promise().query(
            'SELECT idDetalleRol FROM detallerols WHERE userIdUser = ? AND roleIdRol = ?',
            [usuarioId, rolId]
        );

        if (relacionExiste.length > 0) {
            return res.status(400).json({ message: 'El usuario ya tiene este rol asignado' });
        }

        // Crear nueva relación
        await orm.detalleRol.create({
            userIdUser: usuarioId,
            roleIdRol: rolId,
            createDetalleRol: new Date().toLocaleString()
        });

        return res.status(201).json({ message: 'Rol asignado exitosamente' });

    } catch (error) {
        console.error('Error al asignar rol:', error);
        return res.status(500).json({ message: 'Error al asignar rol', error: error.message });
    }
};

// Remover rol de usuario
usuarioCtl.removerRol = async (req, res) => {
    try {
        const { usuarioId, rolId } = req.body;

        if (!usuarioId || !rolId) {
            return res.status(400).json({ message: 'Usuario y rol son obligatorios' });
        }

        const resultado = await sql.promise().query(
            'DELETE FROM detallerols WHERE userIdUser = ? AND roleIdRol = ?',
            [usuarioId, rolId]
        );

        if (resultado[0].affectedRows === 0) {
            return res.status(404).json({ message: 'Relación usuario-rol no encontrada' });
        }

        return res.json({ message: 'Rol removido exitosamente' });

    } catch (error) {
        console.error('Error al remover rol:', error);
        return res.status(500).json({ message: 'Error al remover rol', error: error.message });
    }
};

// Cambiar estado de usuario
usuarioCtl.cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado || !['active', 'inactive', 'suspended'].includes(estado)) {
            return res.status(400).json({ message: 'Estado inválido. Use: active, inactive, suspended' });
        }

        await sql.promise().query(
            `UPDATE users SET 
                stateUser = ?, 
                updateUser = ? 
             WHERE idUser = ?`,
            [estado, new Date().toLocaleString(), id]
        );

        return res.json({ message: `Estado del usuario cambiado a ${estado} exitosamente` });

    } catch (error) {
        console.error('Error al cambiar estado:', error);
        return res.status(500).json({ message: 'Error al cambiar estado', error: error.message });
    }
};

// Obtener estadísticas de usuarios
usuarioCtl.obtenerEstadisticas = async (req, res) => {
    try {
        const [estadisticas] = await sql.promise().query(`
            SELECT 
                COUNT(CASE WHEN stateUser = 'active' THEN 1 END) as usuariosActivos,
                COUNT(CASE WHEN stateUser = 'inactive' THEN 1 END) as usuariosInactivos,
                COUNT(CASE WHEN stateUser = 'suspended' THEN 1 END) as usuariosSuspendidos,
                COUNT(*) as totalUsuarios
            FROM users
        `);

        // Usuarios por rol
        const [usuariosPorRol] = await sql.promise().query(`
            SELECT r.nameRol, COUNT(dr.userIdUser) as cantidadUsuarios
            FROM roles r
            LEFT JOIN detallerols dr ON r.idRol = dr.roleIdRol
            LEFT JOIN users u ON dr.userIdUser = u.idUser AND u.stateUser = 'active'
            WHERE r.stateRol = 'activo'
            GROUP BY r.idRol, r.nameRol
            ORDER BY cantidadUsuarios DESC
        `);

        return res.json({
            estadisticas: estadisticas[0],
            usuariosPorRol: usuariosPorRol.map(item => ({
                ...item,
                nameRol: descifrarSeguro(item.nameRol)
            }))
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

module.exports = usuarioCtl;