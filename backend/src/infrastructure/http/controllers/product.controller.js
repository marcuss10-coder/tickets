const productsCtl = {};
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

// ================ GESTIÓN DE CATEGORÍAS ================

// Mostrar todas las categorías activas
productsCtl.mostrarCategorias = async (req, res) => {
    try {
        const [categorias] = await sql.promise().query(`
            SELECT pc.*, COUNT(p.idProduct) as totalProductos
            FROM productCategories pc
            LEFT JOIN products p ON pc.idProductCategory = p.categoryId AND p.stateProduct = 1
            WHERE pc.stateCategory = 1
            GROUP BY pc.idProductCategory
            ORDER BY pc.displayOrder ASC, pc.nameCategory ASC
        `);

        const categoriasCompletas = categorias.map(categoria => ({
            ...categoria,
            nameCategory: descifrarSeguro(categoria.nameCategory),
            descriptionCategory: descifrarSeguro(categoria.descriptionCategory),
            totalProductos: categoria.totalProductos || 0
        }));

        return res.json(categoriasCompletas);
    } catch (error) {
        console.error('Error al mostrar categorías:', error);
        return res.status(500).json({ message: 'Error al obtener categorías', error: error.message });
    }
};

// Crear nueva categoría
productsCtl.crearCategoria = async (req, res) => {
    try {
        const { nameCategory, descriptionCategory, iconCategory, displayOrder } = req.body;

        // Validaciones
        if (!nameCategory) {
            return res.status(400).json({ message: 'Nombre de la categoría es obligatorio' });
        }

        // Verificar si ya existe una categoría con el mismo nombre
        const [categoriaExiste] = await sql.promise().query(
            'SELECT idProductCategory FROM productCategories WHERE nameCategory = ? AND stateCategory = 1',
            [cifrarDatos(nameCategory)]
        );

        if (categoriaExiste.length > 0) {
            return res.status(400).json({ message: 'Ya existe una categoría con este nombre' });
        }

        // Crear categoría
        const nuevaCategoria = await orm.ProductCategory.create({
            nameCategory: cifrarDatos(nameCategory),
            descriptionCategory: cifrarDatos(descriptionCategory || ''),
            iconCategory: iconCategory || '',
            displayOrder: parseInt(displayOrder) || 0,
            stateCategory: true,
            createCategory: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Categoría creada exitosamente',
            idCategory: nuevaCategoria.idProductCategory
        });

    } catch (error) {
        console.error('Error al crear categoría:', error);
        return res.status(500).json({ 
            message: 'Error al crear la categoría', 
            error: error.message 
        });
    }
};

// Actualizar categoría
productsCtl.actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nameCategory, descriptionCategory, iconCategory, displayOrder } = req.body;

        // Validaciones
        if (!nameCategory) {
            return res.status(400).json({ message: 'Nombre de la categoría es obligatorio' });
        }

        // Verificar que la categoría existe
        const [categoriaExiste] = await sql.promise().query(
            'SELECT idProductCategory FROM productCategories WHERE idProductCategory = ? AND stateCategory = 1',
            [id]
        );

        if (categoriaExiste.length === 0) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        // Actualizar categoría
        await sql.promise().query(
            `UPDATE productCategories SET 
                nameCategory = ?, 
                descriptionCategory = ?, 
                iconCategory = ?, 
                displayOrder = ?,
                updateCategory = ? 
             WHERE idProductCategory = ?`,
            [
                cifrarDatos(nameCategory),
                cifrarDatos(descriptionCategory || ''),
                iconCategory || '',
                parseInt(displayOrder) || 0,
                new Date().toLocaleString(),
                id
            ]
        );

        return res.json({ message: 'Categoría actualizada exitosamente' });

    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        return res.status(500).json({ message: 'Error al actualizar categoría', error: error.message });
    }
};

// ================ GESTIÓN DE PRODUCTOS ================

// Mostrar todos los productos activos
productsCtl.mostrarProductos = async (req, res) => {
    try {
        const [productos] = await sql.promise().query(`
            SELECT p.*, pc.nameCategory, pc.iconCategory,
                   CASE 
                       WHEN p.discountPercentage > 0 AND NOW() BETWEEN p.discountStartDate AND p.discountEndDate 
                       THEN p.priceProduct * (1 - p.discountPercentage / 100)
                       ELSE p.priceProduct
                   END as finalPrice,
                   CASE 
                       WHEN p.discountPercentage > 0 AND NOW() BETWEEN p.discountStartDate AND p.discountEndDate 
                       THEN true
                       ELSE false
                   END as hasActiveDiscount
            FROM products p
            JOIN productCategories pc ON p.categoryId = pc.idProductCategory
            WHERE p.stateProduct = 1 AND pc.stateCategory = 1
            ORDER BY p.popularProduct DESC, p.newProduct DESC, p.nameProduct ASC
        `);

        const productosCompletos = productos.map(producto => ({
            ...producto,
            nameProduct: descifrarSeguro(producto.nameProduct),
            descriptionProduct: descifrarSeguro(producto.descriptionProduct),
            ingredients: descifrarSeguro(producto.ingredients),
            allergens: descifrarSeguro(producto.allergens),
            nameCategory: descifrarSeguro(producto.nameCategory),
            finalPrice: parseFloat(producto.finalPrice || producto.priceProduct),
            hasActiveDiscount: !!producto.hasActiveDiscount,
            stockStatus: producto.stockProduct <= 5 ? 'bajo' : producto.stockProduct <= 20 ? 'medio' : 'alto'
        }));

        return res.json(productosCompletos);
    } catch (error) {
        console.error('Error al mostrar productos:', error);
        return res.status(500).json({ message: 'Error al obtener productos', error: error.message });
    }
};

// Obtener productos por categoría
productsCtl.obtenerProductosPorCategoria = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const [productos] = await sql.promise().query(`
            SELECT p.*,
                   CASE 
                       WHEN p.discountPercentage > 0 AND NOW() BETWEEN p.discountStartDate AND p.discountEndDate 
                       THEN p.priceProduct * (1 - p.discountPercentage / 100)
                       ELSE p.priceProduct
                   END as finalPrice
            FROM products p
            WHERE p.categoryId = ? AND p.stateProduct = 1 AND p.availableProduct = 1
            ORDER BY p.popularProduct DESC, p.nameProduct ASC
        `, [categoryId]);

        const productosCompletos = productos.map(producto => ({
            ...producto,
            nameProduct: descifrarSeguro(producto.nameProduct),
            descriptionProduct: descifrarSeguro(producto.descriptionProduct),
            finalPrice: parseFloat(producto.finalPrice || producto.priceProduct)
        }));

        return res.json(productosCompletos);
    } catch (error) {
        console.error('Error al obtener productos por categoría:', error);
        return res.status(500).json({ message: 'Error al obtener productos', error: error.message });
    }
};

// Crear nuevo producto
productsCtl.crearProducto = async (req, res) => {
    try {
        const { 
            nameProduct, descriptionProduct, priceProduct, categoryId,
            ingredients, allergens, stockProduct, popularProduct, newProduct,
            discountPercentage, discountStartDate, discountEndDate
        } = req.body;

        // Validaciones
        if (!nameProduct || !priceProduct || !categoryId) {
            return res.status(400).json({ message: 'Nombre, precio y categoría son obligatorios' });
        }

        if (parseFloat(priceProduct) <= 0) {
            return res.status(400).json({ message: 'El precio debe ser mayor a 0' });
        }

        // Verificar que la categoría existe
        const [categoriaExiste] = await sql.promise().query(
            'SELECT idProductCategory FROM productCategories WHERE idProductCategory = ? AND stateCategory = 1',
            [categoryId]
        );

        if (categoriaExiste.length === 0) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        // Crear producto
        const nuevoProducto = await orm.Product.create({
            nameProduct: cifrarDatos(nameProduct),
            descriptionProduct: cifrarDatos(descriptionProduct || ''),
            priceProduct: parseFloat(priceProduct),
            categoryId: parseInt(categoryId),
            ingredients: cifrarDatos(ingredients || ''),
            allergens: cifrarDatos(allergens || ''),
            availableProduct: true,
            stockProduct: parseInt(stockProduct) || 0,
            popularProduct: !!popularProduct,
            newProduct: !!newProduct,
            discountPercentage: parseFloat(discountPercentage) || 0,
            discountStartDate: discountStartDate ? new Date(discountStartDate) : null,
            discountEndDate: discountEndDate ? new Date(discountEndDate) : null,
            ratingProduct: 0.0,
            voteCount: 0,
            stateProduct: true,
            createProduct: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Producto creado exitosamente',
            idProduct: nuevoProducto.idProduct
        });

    } catch (error) {
        console.error('Error al crear producto:', error);
        return res.status(500).json({ 
            message: 'Error al crear el producto', 
            error: error.message 
        });
    }
};

// Actualizar producto
productsCtl.actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nameProduct, descriptionProduct, priceProduct, categoryId,
            ingredients, allergens, stockProduct, availableProduct,
            popularProduct, newProduct, discountPercentage, 
            discountStartDate, discountEndDate
        } = req.body;

        // Validaciones
        if (!nameProduct || !priceProduct || !categoryId) {
            return res.status(400).json({ message: 'Nombre, precio y categoría son obligatorios' });
        }

        // Verificar que el producto existe
        const [productoExiste] = await sql.promise().query(
            'SELECT idProduct FROM products WHERE idProduct = ? AND stateProduct = 1',
            [id]
        );

        if (productoExiste.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Actualizar producto
        await sql.promise().query(
            `UPDATE products SET 
                nameProduct = ?, 
                descriptionProduct = ?, 
                priceProduct = ?, 
                categoryId = ?,
                ingredients = ?,
                allergens = ?,
                stockProduct = ?,
                availableProduct = ?,
                popularProduct = ?,
                newProduct = ?,
                discountPercentage = ?,
                discountStartDate = ?,
                discountEndDate = ?,
                updateProduct = ? 
             WHERE idProduct = ?`,
            [
                cifrarDatos(nameProduct),
                cifrarDatos(descriptionProduct || ''),
                parseFloat(priceProduct),
                parseInt(categoryId),
                cifrarDatos(ingredients || ''),
                cifrarDatos(allergens || ''),
                parseInt(stockProduct) || 0,
                !!availableProduct,
                !!popularProduct,
                !!newProduct,
                parseFloat(discountPercentage) || 0,
                discountStartDate ? new Date(discountStartDate) : null,
                discountEndDate ? new Date(discountEndDate) : null,
                new Date().toLocaleString(),
                id
            ]
        );

        return res.json({ message: 'Producto actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        return res.status(500).json({ message: 'Error al actualizar producto', error: error.message });
    }
};

// ================ GESTIÓN DE INVENTARIO ================

// Actualizar stock de producto
productsCtl.actualizarStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, operation, motivo } = req.body;

        // Validaciones
        if (!quantity || !operation || !['add', 'subtract', 'set'].includes(operation)) {
            return res.status(400).json({ message: 'Cantidad y operación válida son obligatorias' });
        }

        // Obtener stock actual
        const [producto] = await sql.promise().query(
            'SELECT stockProduct, nameProduct FROM products WHERE idProduct = ? AND stateProduct = 1',
            [id]
        );

        if (producto.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        let nuevoStock = producto[0].stockProduct;
        const stockAnterior = nuevoStock;

        // Calcular nuevo stock según la operación
        switch (operation) {
            case 'add':
                nuevoStock += parseInt(quantity);
                break;
            case 'subtract':
                nuevoStock = Math.max(0, nuevoStock - parseInt(quantity));
                break;
            case 'set':
                nuevoStock = parseInt(quantity);
                break;
        }

        // Actualizar stock
        await sql.promise().query(
            'UPDATE products SET stockProduct = ?, updateProduct = ? WHERE idProduct = ?',
            [nuevoStock, new Date().toLocaleString(), id]
        );

        // Verificar si el stock está bajo
        const alertaBajo = nuevoStock <= 5;

        return res.json({ 
            message: 'Stock actualizado exitosamente',
            stockAnterior: stockAnterior,
            stockNuevo: nuevoStock,
            operacion: operation,
            cantidad: quantity,
            alertaBajo: alertaBajo
        });

    } catch (error) {
        console.error('Error al actualizar stock:', error);
        return res.status(500).json({ message: 'Error al actualizar stock', error: error.message });
    }
};

// Obtener productos con stock bajo
productsCtl.obtenerStockBajo = async (req, res) => {
    try {
        const { limite = 5 } = req.query;

        const [productos] = await sql.promise().query(`
            SELECT p.*, pc.nameCategory
            FROM products p
            JOIN productCategories pc ON p.categoryId = pc.idProductCategory
            WHERE p.stateProduct = 1 AND p.stockProduct <= ?
            ORDER BY p.stockProduct ASC
        `, [parseInt(limite)]);

        const productosCompletos = productos.map(producto => ({
            ...producto,
            nameProduct: descifrarSeguro(producto.nameProduct),
            nameCategory: descifrarSeguro(producto.nameCategory),
            nivelAlerta: producto.stockProduct === 0 ? 'crítico' : producto.stockProduct <= 2 ? 'muy_bajo' : 'bajo'
        }));

        return res.json(productosCompletos);
    } catch (error) {
        console.error('Error al obtener productos con stock bajo:', error);
        return res.status(500).json({ message: 'Error al obtener productos', error: error.message });
    }
};

// ================ GESTIÓN DE DESCUENTOS ================

// Aplicar descuento a producto
productsCtl.aplicarDescuento = async (req, res) => {
    try {
        const { id } = req.params;
        const { discountPercentage, startDate, endDate } = req.body;

        // Validaciones
        if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
            return res.status(400).json({ message: 'Porcentaje de descuento debe estar entre 1 y 100' });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Fechas de inicio y fin son obligatorias' });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ message: 'La fecha de inicio debe ser anterior a la fecha de fin' });
        }

        // Aplicar descuento
        await sql.promise().query(
            `UPDATE products SET 
                discountPercentage = ?, 
                discountStartDate = ?, 
                discountEndDate = ?,
                updateProduct = ? 
             WHERE idProduct = ? AND stateProduct = 1`,
            [
                parseFloat(discountPercentage),
                new Date(startDate),
                new Date(endDate),
                new Date().toLocaleString(),
                id
            ]
        );

        return res.json({ message: 'Descuento aplicado exitosamente' });

    } catch (error) {
        console.error('Error al aplicar descuento:', error);
        return res.status(500).json({ message: 'Error al aplicar descuento', error: error.message });
    }
};

// Obtener productos en oferta
productsCtl.obtenerProductosEnOferta = async (req, res) => {
    try {
        const [productos] = await sql.promise().query(`
            SELECT p.*, pc.nameCategory,
                   p.priceProduct * (1 - p.discountPercentage / 100) as discountedPrice,
                   p.priceProduct - (p.priceProduct * (1 - p.discountPercentage / 100)) as savings
            FROM products p
            JOIN productCategories pc ON p.categoryId = pc.idProductCategory
            WHERE p.stateProduct = 1 
            AND p.discountPercentage > 0 
            AND NOW() BETWEEN p.discountStartDate AND p.discountEndDate
            ORDER BY p.discountPercentage DESC
        `);

        const productosCompletos = productos.map(producto => ({
            ...producto,
            nameProduct: descifrarSeguro(producto.nameProduct),
            descriptionProduct: descifrarSeguro(producto.descriptionProduct),
            nameCategory: descifrarSeguro(producto.nameCategory),
            discountedPrice: parseFloat(producto.discountedPrice).toFixed(2),
            savings: parseFloat(producto.savings).toFixed(2)
        }));

        return res.json(productosCompletos);
    } catch (error) {
        console.error('Error al obtener productos en oferta:', error);
        return res.status(500).json({ message: 'Error al obtener productos', error: error.message });
    }
};

// ================ BÚSQUEDA Y FILTROS ================

// Buscar productos
productsCtl.buscarProductos = async (req, res) => {
    try {
        const { q, categoryId, minPrice, maxPrice, available, popular } = req.query;

        let query = `
            SELECT p.*, pc.nameCategory,
                   CASE 
                       WHEN p.discountPercentage > 0 AND NOW() BETWEEN p.discountStartDate AND p.discountEndDate 
                       THEN p.priceProduct * (1 - p.discountPercentage / 100)
                       ELSE p.priceProduct
                   END as finalPrice
            FROM products p
            JOIN productCategories pc ON p.categoryId = pc.idProductCategory
            WHERE p.stateProduct = 1 AND pc.stateCategory = 1
        `;

        const params = [];

        if (q) {
            query += ' AND (p.nameProduct LIKE ? OR p.descriptionProduct LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm);
        }

        if (categoryId) {
            query += ' AND p.categoryId = ?';
            params.push(categoryId);
        }

        if (minPrice) {
            query += ' AND p.priceProduct >= ?';
            params.push(parseFloat(minPrice));
        }

        if (maxPrice) {
            query += ' AND p.priceProduct <= ?';
            params.push(parseFloat(maxPrice));
        }

        if (available !== undefined) {
            query += ' AND p.availableProduct = ?';
            params.push(available === 'true');
        }

        if (popular !== undefined) {
            query += ' AND p.popularProduct = ?';
            params.push(popular === 'true');
        }

        query += ' ORDER BY p.popularProduct DESC, p.nameProduct ASC';

        const [productos] = await sql.promise().query(query, params);

        const productosCompletos = productos.map(producto => ({
            ...producto,
            nameProduct: descifrarSeguro(producto.nameProduct),
            descriptionProduct: descifrarSeguro(producto.descriptionProduct),
            nameCategory: descifrarSeguro(producto.nameCategory),
            finalPrice: parseFloat(producto.finalPrice || producto.priceProduct)
        }));

        return res.json(productosCompletos);
    } catch (error) {
        console.error('Error al buscar productos:', error);
        return res.status(500).json({ message: 'Error al buscar productos', error: error.message });
    }
};

// ================ ESTADÍSTICAS ================

// Obtener estadísticas de productos
productsCtl.obtenerEstadisticas = async (req, res) => {
    try {
        // Estadísticas generales
        const [estadisticasGenerales] = await sql.promise().query(`
            SELECT 
                COUNT(*) as totalProductos,
                COUNT(CASE WHEN availableProduct = 1 THEN 1 END) as productosDisponibles,
                COUNT(CASE WHEN stockProduct <= 5 THEN 1 END) as productosStockBajo,
                COUNT(CASE WHEN discountPercentage > 0 AND NOW() BETWEEN discountStartDate AND discountEndDate THEN 1 END) as productosEnOferta,
                AVG(priceProduct) as precioPromedio,
                SUM(stockProduct) as inventarioTotal
            FROM products 
            WHERE stateProduct = 1
        `);

        // Productos más populares
        const [productosPopulares] = await sql.promise().query(`
            SELECT p.nameProduct, p.ratingProduct, p.voteCount, pc.nameCategory
            FROM products p
            JOIN productCategories pc ON p.categoryId = pc.idProductCategory
            WHERE p.stateProduct = 1 AND p.popularProduct = 1
            ORDER BY p.ratingProduct DESC, p.voteCount DESC
            LIMIT 5
        `);

        // Distribución por categorías
        const [distribucionCategorias] = await sql.promise().query(`
            SELECT pc.nameCategory, COUNT(p.idProduct) as cantidad,
                   AVG(p.priceProduct) as precioPromedio
            FROM productCategories pc
            LEFT JOIN products p ON pc.idProductCategory = p.categoryId AND p.stateProduct = 1
            WHERE pc.stateCategory = 1
            GROUP BY pc.idProductCategory
            ORDER BY cantidad DESC
        `);

        return res.json({
            estadisticas: {
                ...estadisticasGenerales[0],
                precioPromedio: parseFloat(estadisticasGenerales[0].precioPromedio || 0).toFixed(2)
            },
            productosPopulares: productosPopulares.map(producto => ({
                ...producto,
                nameProduct: descifrarSeguro(producto.nameProduct),
                nameCategory: descifrarSeguro(producto.nameCategory)
            })),
            distribucionCategorias: distribucionCategorias.map(categoria => ({
                ...categoria,
                nameCategory: descifrarSeguro(categoria.nameCategory),
                precioPromedio: parseFloat(categoria.precioPromedio || 0).toFixed(2)
            }))
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// ================ FUNCIONES AUXILIARES ================

// Eliminar (desactivar) producto
productsCtl.eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        await sql.promise().query(
            'UPDATE products SET stateProduct = 0, updateProduct = ? WHERE idProduct = ?',
            [new Date().toLocaleString(), id]
        );

        return res.json({ message: 'Producto desactivado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        return res.status(500).json({ message: 'Error al desactivar producto', error: error.message });
    }
};

// Eliminar (desactivar) categoría
productsCtl.eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si hay productos asociados
        const [productosAsociados] = await sql.promise().query(
            'SELECT COUNT(*) as total FROM products WHERE categoryId = ? AND stateProduct = 1',
            [id]
        );

        if (productosAsociados[0].total > 0) {
            return res.status(400).json({ 
                message: `No se puede eliminar la categoría. Tiene ${productosAsociados[0].total} producto(s) asociado(s)` 
            });
        }

        await sql.promise().query(
            'UPDATE productCategories SET stateCategory = 0, updateCategory = ? WHERE idProductCategory = ?',
            [new Date().toLocaleString(), id]
        );

        return res.json({ message: 'Categoría desactivada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        return res.status(500).json({ message: 'Error al desactivar categoría', error: error.message });
    }
};

module.exports = productsCtl;