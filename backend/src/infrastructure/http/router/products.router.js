const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { 
    mostrarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria,
    mostrarProductos, obtenerProductosPorCategoria, crearProducto, actualizarProducto,
    eliminarProducto, actualizarStock, obtenerStockBajo, aplicarDescuento,
    obtenerProductosEnOferta, buscarProductos, obtenerEstadisticas
} = require('../../http/controllers/product.controller');

// Validaciones para categorías
const validacionCategoria = [
    body('nameCategory')
        .notEmpty()
        .withMessage('Nombre de la categoría es obligatorio')
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    
    body('descriptionCategory')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La descripción no puede exceder 255 caracteres'),
    
    body('displayOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('El orden debe ser un número entero positivo')
];

// Validaciones para productos
const validacionProducto = [
    body('nameProduct')
        .notEmpty()
        .withMessage('Nombre del producto es obligatorio')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('priceProduct')
        .isFloat({ min: 0.01 })
        .withMessage('El precio debe ser mayor a 0'),
    
    body('categoryId')
        .isInt({ min: 1 })
        .withMessage('ID de categoría debe ser válido'),
    
    body('stockProduct')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock debe ser un número entero positivo'),
    
    body('discountPercentage')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Descuento debe estar entre 0 y 100%')
];

// Validaciones para stock
const validacionStock = [
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Cantidad debe ser un número entero positivo'),
    
    body('operation')
        .isIn(['add', 'subtract', 'set'])
        .withMessage('Operación debe ser: add, subtract o set'),
    
    body('motivo')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Motivo no puede exceder 255 caracteres')
];

// Validaciones para descuentos
const validacionDescuento = [
    body('discountPercentage')
        .isFloat({ min: 0.01, max: 100 })
        .withMessage('Descuento debe estar entre 0.01 y 100%'),
    
    body('startDate')
        .isISO8601()
        .withMessage('Fecha de inicio debe ser válida'),
    
    body('endDate')
        .isISO8601()
        .withMessage('Fecha de fin debe ser válida')
        .custom((endDate, { req }) => {
            if (new Date(endDate) <= new Date(req.body.startDate)) {
                throw new Error('Fecha de fin debe ser posterior a fecha de inicio');
            }
            return true;
        })
];

// ================ RUTAS DE CATEGORÍAS ================
router.get('/categorias', mostrarCategorias);
router.post('/categorias', validacionCategoria, crearCategoria);
router.put('/categorias/:id', validacionCategoria, actualizarCategoria);
router.delete('/categorias/:id', eliminarCategoria);

// ================ RUTAS DE PRODUCTOS ================
router.get('/productos', mostrarProductos);
router.get('/productos/buscar', buscarProductos);
router.get('/productos/ofertas', obtenerProductosEnOferta);
router.get('/productos/stock-bajo', obtenerStockBajo);
router.get('/categorias/:categoryId/productos', obtenerProductosPorCategoria);
router.post('/productos', validacionProducto, crearProducto);
router.put('/productos/:id', validacionProducto, actualizarProducto);
router.delete('/productos/:id', eliminarProducto);

// ================ RUTAS DE INVENTARIO ================
router.put('/productos/:id/stock', validacionStock, actualizarStock);
router.put('/productos/:id/descuento', validacionDescuento, aplicarDescuento);

// ================ ESTADÍSTICAS ================
router.get('/estadisticas', obtenerEstadisticas);

module.exports = router;
