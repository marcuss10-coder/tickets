const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, logout, getProfile, validarCredenciales } = require('../../http/controllers/auth.controller');
const isLoggedIn = require('../../../application/auth');

// Validaciones mejoradas
const registerValidation = [
    body('nameUsers')
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('emailUser')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    
    body('userName')
        .notEmpty()
        .withMessage('El nombre de usuario es obligatorio')
        .isLength({ min: 3, max: 50 })
        .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
    
    body('passwordUser')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    
    body('phoneUser')
        .optional()
        .isMobilePhone()
        .withMessage('Debe ser un número de teléfono válido')
];

const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('Usuario o email es obligatorio'),
    
    body('password')
        .notEmpty()
        .withMessage('La contraseña es obligatoria')
        .isLength({ min: 1 })
        .withMessage('La contraseña no puede estar vacía')
];

const validarCredencialesValidation = [
    body('identifier')
        .notEmpty()
        .withMessage('El identificador (usuario o email) es obligatorio')
];

// Rutas
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', isLoggedIn, logout);
router.get('/profile', isLoggedIn, getProfile);

// Endpoint adicional para validar credenciales (útil para testing)
router.post('/validar-credenciales', validarCredencialesValidation, validarCredenciales);

// Endpoint para verificar si el usuario está autenticado
router.get('/check', (req, res) => {
    if (req.isAuthenticated()) {
        return res.json({
            authenticated: true,
            user: {
                id: req.user.idUser,
                name: req.user.nameUsers,
                email: req.user.emailUser,
                username: req.user.userName
            }
        });
    } else {
        return res.json({
            authenticated: false
        });
    }
});

module.exports = router;
