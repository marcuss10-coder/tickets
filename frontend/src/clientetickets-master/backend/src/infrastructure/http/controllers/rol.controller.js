const rolCtl = {};
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

// Mostrar todos los roles activos
rolCtl.mostrarRoles = async (req, res) => {
    try {
        const [listaRoles] = await sql.promise().query(`
            SELECT r.*, COUNT(dr.userIdUser) as cantidadUsuarios
            FROM roles r
            LEFT JOIN detallerols dr ON r.idRol = dr.roleIdRol
            LEFT JOIN users u ON dr.userIdUser = u.idUser AND u.stateUser = 'active'
            WHERE r.stateRol = 'activo'
            GROUP BY r.idRol
            ORDER BY r.createRol DESC
        `);

        const rolesCompletos = listaRoles.map(rol => ({
            ...rol,
            nameRol: descifrarSeguro(rol.nameRol),
            descriptionRol: descifrarSeguro(rol.descriptionRol),
            cantidadUsuarios: rol.cantidadUsuarios || 0
        }));

        return res.json(rolesCompletos);
    } catch (error) {
        console.error('Error al mostrar roles:', error);
        return res.status(500).json({ message: 'Error al obtener los roles', error: error.message });
    }
};

// Crear nuevo rol
rolCtl.crearRol = async (req, res) => {
    try {
        const { nameRol, descriptionRol } = req.body;

        // Validación de campos requeridos
        if (!nameRol) {
            return res.status(400).json({ message: 'Nombre del rol es obligatorio' });
        }

        // Verificar si ya existe un rol con el mismo nombre
        const [rolExiste] = await sql.promise().query(
            'SELECT idRol FROM roles WHERE nameRol = ? AND stateRol = "activo"',
            [cifrarDatos(nameRol)]
        );

        if (rolExiste.length > 0) {
            return res.status(400).json({ message: 'Ya existe un rol con este nombre' });
        }

        // Crear rol en SQL
        const nuevoRol = await orm.rol.create({
            nameRol: cifrarDatos(nameRol),
            descriptionRol: cifrarDatos(descriptionRol || ''),
            stateRol: 'activo',
            createRol: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Rol creado exitosamente',
            idRol: nuevoRol.idRol
        });

    } catch (error) {
        console.error('Error al crear rol:', error);
        return res.status(500).json({ 
            message: 'Error al crear el rol', 
            error: error.message 
        });
    }
};

// Actualizar rol
rolCtl.actualizarRol = async (req, res) => {
    try {
        const { id } = req.params;
        const { nameRol, descriptionRol } = req.body;

        // Validar campos
        if (!nameRol) {
            return res.status(400).json({ message: 'Nombre del rol es obligatorio' });
        }

        // Verificar si existe el rol
        const [rolExiste] = await sql.promise().query(
            'SELECT idRol FROM roles WHERE idRol = ? AND stateRol = "activo"',
            [id]
        );

        if (rolExiste.length === 0) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        // Verificar si el nuevo nombre ya existe (excluyendo el rol actual)
        const [nombreDuplicado] = await sql.promise().query(
            'SELECT idRol FROM roles WHERE nameRol = ? AND idRol != ? AND stateRol = "activo"',
            [cifrarDatos(nameRol), id]
        );

        if (nombreDuplicado.length > 0) {
            return res.status(400).json({ message: 'Ya existe otro rol con este nombre' });
        }

        // Actualizar rol en SQL
        await sql.promise().query(
            `UPDATE roles SET 
                nameRol = ?, 
                descriptionRol = ?, 
                updateRol = ? 
             WHERE idRol = ?`,
            [
                cifrarDatos(nameRol),
                cifrarDatos(descriptionRol || ''),
                new Date().toLocaleString(),
                id
            ]
        );

        return res.json({ message: 'Rol actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar rol:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Eliminar (desactivar) rol
rolCtl.eliminarRol = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si hay usuarios asignados a este rol
        const [usuariosAsignados] = await sql.promise().query(`
            SELECT COUNT(dr.userIdUser) as total 
            FROM detallerols dr
            JOIN users u ON dr.userIdUser = u.idUser
            WHERE dr.roleIdRol = ? AND u.stateUser = 'active'
        `, [id]);

        if (usuariosAsignados[0].total > 0) {
            return res.status(400).json({ 
                message: `No se puede eliminar el rol. Tiene ${usuariosAsignados[0].total} usuario(s) asignado(s)` 
            });
        }

        // Desactivar rol
        await sql.promise().query(
            `UPDATE roles SET 
                stateRol = 'inactivo', 
                updateRol = ? 
             WHERE idRol = ?`,
            [new Date().toLocaleString(), id]
        );

        return res.json({ message: 'Rol desactivado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        return res.status(500).json({ message: 'Error al desactivar', error: error.message });
    }
};

// Obtener rol por ID con usuarios asignados
rolCtl.obtenerRol = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rol] = await sql.promise().query(
            'SELECT * FROM roles WHERE idRol = ? AND stateRol = "activo"',
            [id]
        );

        if (rol.length === 0) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        // Obtener usuarios con este rol
        const [usuariosDelRol] = await sql.promise().query(`
            SELECT u.idUser, u.nameUsers, u.emailUser, u.userName, dr.createDetalleRol
            FROM detallerols dr
            JOIN users u ON dr.userIdUser = u.idUser
            WHERE dr.roleIdRol = ? AND u.stateUser = 'active'
            ORDER BY dr.createDetalleRol DESC
        `, [id]);

        const rolCompleto = {
            ...rol[0],
            nameRol: descifrarSeguro(rol[0].nameRol),
            descriptionRol: descifrarSeguro(rol[0].descriptionRol),
            usuarios: usuariosDelRol.map(usuario => ({
                ...usuario,
                nameUsers: descifrarSeguro(usuario.nameUsers),
                emailUser: descifrarSeguro(usuario.emailUser),
                userName: descifrarSeguro(usuario.userName)
            }))
        };

        return res.json(rolCompleto);
    } catch (error) {
        console.error('Error al obtener rol:', error);
        return res.status(500).json({ message: 'Error al obtener rol', error: error.message });
    }
};

// Buscar roles por nombre
rolCtl.buscarRoles = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ message: 'Consulta debe tener al menos 2 caracteres' });
        }

        const [rolesEncontrados] = await sql.promise().query(`
            SELECT r.*, COUNT(dr.userIdUser) as cantidadUsuarios
            FROM roles r
            LEFT JOIN detallerols dr ON r.idRol = dr.roleIdRol
            LEFT JOIN users u ON dr.userIdUser = u.idUser AND u.stateUser = 'active'
            WHERE r.stateRol = 'activo' AND (
                r.nameRol LIKE ? OR 
                r.descriptionRol LIKE ?
            )
            GROUP BY r.idRol
            LIMIT 10
        `, [`%${q}%`, `%${q}%`]);

        const resultados = rolesEncontrados.map(rol => ({
            ...rol,
            nameRol: descifrarSeguro(rol.nameRol),
            descriptionRol: descifrarSeguro(rol.descriptionRol),
            cantidadUsuarios: rol.cantidadUsuarios || 0
        }));

        return res.json(resultados);
    } catch (error) {
        console.error('Error al buscar roles:', error);
        return res.status(500).json({ message: 'Error en la búsqueda', error: error.message });
    }
};

// Cambiar estado de rol
rolCtl.cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado || !['activo', 'inactivo'].includes(estado)) {
            return res.status(400).json({ message: 'Estado inválido. Use: activo, inactivo' });
        }

        // Si se va a desactivar, verificar que no tenga usuarios asignados
        if (estado === 'inactivo') {
            const [usuariosAsignados] = await sql.promise().query(`
                SELECT COUNT(dr.userIdUser) as total 
                FROM detallerols dr
                JOIN users u ON dr.userIdUser = u.idUser
                WHERE dr.roleIdRol = ? AND u.stateUser = 'active'
            `, [id]);

            if (usuariosAsignados[0].total > 0) {
                return res.status(400).json({ 
                    message: `No se puede desactivar el rol. Tiene ${usuariosAsignados[0].total} usuario(s) asignado(s)` 
                });
            }
        }

        await sql.promise().query(
            `UPDATE roles SET 
                stateRol = ?, 
                updateRol = ? 
             WHERE idRol = ?`,
            [estado, new Date().toLocaleString(), id]
        );

        return res.json({ message: `Estado del rol cambiado a ${estado} exitosamente` });

    } catch (error) {
        console.error('Error al cambiar estado:', error);
        return res.status(500).json({ message: 'Error al cambiar estado', error: error.message });
    }
};

// Obtener estadísticas de roles
rolCtl.obtenerEstadisticas = async (req, res) => {
    try {
        const [estadisticas] = await sql.promise().query(`
            SELECT 
                COUNT(CASE WHEN stateRol = 'activo' THEN 1 END) as rolesActivos,
                COUNT(CASE WHEN stateRol = 'inactivo' THEN 1 END) as rolesInactivos,
                COUNT(*) as totalRoles
            FROM roles
        `);

        // Roles más utilizados
        const [rolesMasUtilizados] = await sql.promise().query(`
            SELECT r.nameRol, COUNT(dr.userIdUser) as cantidadUsuarios
            FROM roles r
            LEFT JOIN detallerols dr ON r.idRol = dr.roleIdRol
            LEFT JOIN users u ON dr.userIdUser = u.idUser AND u.stateUser = 'active'
            WHERE r.stateRol = 'activo'
            GROUP BY r.idRol, r.nameRol
            ORDER BY cantidadUsuarios DESC
            LIMIT 5
        `);

        return res.json({
            estadisticas: estadisticas[0],
            rolesMasUtilizados: rolesMasUtilizados.map(item => ({
                ...item,
                nameRol: descifrarSeguro(item.nameRol)
            }))
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// Crear roles por defecto del sistema
rolCtl.crearRolesPorDefecto = async (req, res) => {
    try {
        const rolesPorDefecto = [
            { 
                nombre: 'Administrador', 
                descripcion: 'Acceso completo al sistema' 
            },
            { 
                nombre: 'Operador', 
                descripcion: 'Gestión de transporte y rutas' 
            },
            { 
                nombre: 'Supervisor', 
                descripcion: 'Supervisión y reportes' 
            },
            { 
                nombre: 'Usuario', 
                descripcion: 'Acceso básico al sistema' 
            },
            { 
                nombre: 'Conductor', 
                descripcion: 'Rol específico para conductores' 
            }
        ];

        let rolesCreados = 0;

        for (const rol of rolesPorDefecto) {
            // Verificar si ya existe
            const [existe] = await sql.promise().query(
                'SELECT idRol FROM roles WHERE nameRol = ?',
                [cifrarDatos(rol.nombre)]
            );

            if (existe.length === 0) {
                await orm.rol.create({
                    nameRol: cifrarDatos(rol.nombre),
                    descriptionRol: cifrarDatos(rol.descripcion),
                    stateRol: 'activo',
                    createRol: new Date().toLocaleString(),
                });
                rolesCreados++;
            }
        }

        return res.status(201).json({ 
            message: `Roles por defecto procesados. ${rolesCreados} roles nuevos creados.`
        });

    } catch (error) {
        console.error('Error al crear roles por defecto:', error);
        return res.status(500).json({ 
            message: 'Error al crear roles por defecto', 
            error: error.message 
        });
    }
};

module.exports = rolCtl;