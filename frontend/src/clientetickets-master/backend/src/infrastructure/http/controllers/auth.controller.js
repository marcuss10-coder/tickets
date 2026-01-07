const passport = require('passport');
const orm = require('../../../infrastructure/database/connection/dataBase.orm');
const sql = require('../../../infrastructure/database/connection/dataBase.sql');
const { validationResult } = require('express-validator');
const { cifrarDatos, descifrarDatos } = require('../../../application/encrypDates');
const bcrypt = require('bcrypt');

const authCtl = {};

// Función para descifrar de forma segura
const descifrarSeguro = (dato) => {
    try {
        return dato ? descifrarDatos(dato) : '';
    } catch (error) {
        console.error('Error al descifrar:', error);
        return '';
    }
};

// Función para preparar el objeto de usuario para respuesta
const prepararUsuarioParaRespuesta = (user) => {
    return {
        id: user.idUser,
        name: user.nameUsers, // Ya viene descifrado del passport
        email: user.emailUser,
        username: user.userName
    };
};

// Función para buscar usuario por credenciales (username o email)
const buscarUsuarioPorCredenciales = async (identifier) => {
    try {
        const [users] = await sql.promise().query(
            'SELECT * FROM users WHERE stateUser = "active"'
        );

        for (const user of users) {
            try {
                const userNameDescifrado = descifrarSeguro(user.userName);
                const emailDescifrado = descifrarSeguro(user.emailUser);
                
                if (userNameDescifrado === identifier || emailDescifrado === identifier) {
                    return user;
                }
            } catch (error) {
                continue;
            }
        }
        return null;
    } catch (error) {
        console.error('Error en búsqueda:', error);
        return null;
    }
};

// Register endpoint
authCtl.register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.apiError('Errores de validación', 400, errors.array());
        }

        const { nameUsers, phoneUser, emailUser, userName, passwordUser } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await buscarUsuarioPorCredenciales(userName);
        const existingEmail = await buscarUsuarioPorCredenciales(emailUser);

        if (existingUser) {
            return res.apiError('El nombre de usuario ya existe', 400);
        }

        if (existingEmail) {
            return res.apiError('El email ya está registrado', 400);
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(passwordUser, 10);

        // Crear usuario con datos cifrados
        const nuevoUsuario = await orm.usuario.create({
            nameUsers: cifrarDatos(nameUsers),
            phoneUser: cifrarDatos(phoneUser || ''),
            emailUser: cifrarDatos(emailUser),
            userName: cifrarDatos(userName),
            passwordUser: hashedPassword,
            stateUser: 'active',
            createUser: new Date().toLocaleString()
        });

        // Preparar objeto para la sesión
        const userForSession = {
            idUser: nuevoUsuario.idUser,
            nameUsers: nameUsers,
            phoneUser: phoneUser,
            emailUser: emailUser,
            userName: userName,
            stateUser: 'active'
        };

        // Iniciar sesión automáticamente
        req.logIn(userForSession, (err) => {
            if (err) {
                return res.apiError('Error al iniciar sesión después del registro', 500);
            }
            
            return res.apiResponse({
                user: prepararUsuarioParaRespuesta(userForSession),
                token: req.sessionID
            }, 201, 'Usuario registrado exitosamente');
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.apiError('Error interno del servidor', 500);
    }
};

// Login endpoint
authCtl.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.apiError('Errores de validación', 400, errors.array());
        }

        const { username, password } = req.body;

        // Buscar usuario
        const user = await buscarUsuarioPorCredenciales(username);

        if (!user) {
            return res.apiError('Credenciales inválidas', 401);
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.passwordUser);

        if (!isValidPassword) {
            return res.apiError('Credenciales inválidas', 401);
        }

        // Preparar objeto para la sesión con datos descifrados
        const userForSession = {
            idUser: user.idUser,
            nameUsers: descifrarSeguro(user.nameUsers),
            phoneUser: descifrarSeguro(user.phoneUser),
            emailUser: descifrarSeguro(user.emailUser),
            userName: descifrarSeguro(user.userName),
            stateUser: user.stateUser
        };

        req.logIn(userForSession, (err) => {
            if (err) {
                return res.apiError('Error al iniciar sesión', 500);
            }
            
            return res.apiResponse({
                user: prepararUsuarioParaRespuesta(userForSession),
                token: req.sessionID
            }, 200, 'Inicio de sesión exitoso');
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.apiError('Error interno del servidor', 500);
    }
};

// Logout endpoint
authCtl.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.apiError('Error al cerrar sesión', 500);
        }
        req.session.destroy((err) => {
            if (err) {
                return res.apiError('Error al destruir la sesión', 500);
            }
            res.clearCookie('secureSessionId');
            return res.apiResponse(null, 200, 'Sesión cerrada exitosamente');
        });
    });
};

// Get current user
authCtl.getProfile = (req, res) => {
    if (!req.isAuthenticated()) {
        return res.apiError('No autenticado', 401);
    }
    
    return res.apiResponse({
        user: prepararUsuarioParaRespuesta(req.user)
    }, 200, 'Perfil obtenido exitosamente');
};

// Validar usuario por credenciales (endpoint adicional para testing)
authCtl.validarCredenciales = async (req, res) => {
    try {
        const { identifier } = req.body;
        
        const user = await buscarUsuarioPorCredenciales(identifier);
        
        if (user) {
            return res.apiResponse({
                found: true,
                user: {
                    id: user.idUser,
                    username: descifrarSeguro(user.userName),
                    email: descifrarSeguro(user.emailUser),
                    name: descifrarSeguro(user.nameUsers)
                }
            }, 200, 'Usuario encontrado');
        } else {
            return res.apiResponse({
                found: false
            }, 200, 'Usuario no encontrado');
        }
    } catch (error) {
        console.error('Error al validar credenciales:', error);
        res.apiError('Error interno del servidor', 500);
    }
};

module.exports = authCtl;