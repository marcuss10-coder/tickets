const transactionsCtl = {};
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

// Función para generar número de transacción único
const generarNumeroTransaccion = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `TXN-${timestamp}-${random.toUpperCase()}`;
};

// ================ PROCESAMIENTO DE PAGOS ================

// Procesar nuevo pago
transactionsCtl.procesarPago = async (req, res) => {
    try {
        const {
            reservationId, usuarioId, amount, currency, paymentMethod,
            paymentProvider, externalReference, items
        } = req.body;

        // Validaciones
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Monto debe ser mayor a 0' });
        }

        if (!paymentMethod || !['CreditCard', 'DebitCard', 'PayPal', 'Transfer', 'Cash'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Método de pago inválido' });
        }

        // Generar número de transacción único
        const transactionNumber = generarNumeroTransaccion();

        // Calcular comisión del procesador (simulada)
        const processorCommission = paymentProvider === 'Cash' ? 0 : amount * 0.029; // 2.9%

        // Crear transacción
        const nuevaTransaccion = await orm.Transaction.create({
            transactionNumber: transactionNumber,
            reservationId: reservationId || null,
            usuarioId: usuarioId || null,
            paymentMethod: paymentMethod,
            paymentProvider: paymentProvider || 'Stripe',
            amount: parseFloat(amount),
            currency: currency || 'USD',
            stateTransaction: 'Pending',
            externalReference: externalReference || '',
            processingDate: new Date(),
            processorCommission: parseFloat(processorCommission),
            createTransaction: new Date().toLocaleString(),
        });

        // Simular procesamiento según el método de pago
        let estadoFinal = 'Processing';
        let mensaje = 'Transacción en procesamiento';

        if (paymentMethod === 'Cash') {
            estadoFinal = 'Completed';
            mensaje = 'Pago en efectivo completado';
            
            // Actualizar transacción a completada
            await sql.promise().query(
                'UPDATE transactions SET stateTransaction = ?, completedDate = ?, updateTransaction = ? WHERE idTransaction = ?',
                ['Completed', new Date(), new Date().toLocaleString(), nuevaTransaccion.idTransaction]
            );
        } else {
            // Para otros métodos, simular procesamiento asíncrono
            // En producción, aquí se integraría con la pasarela de pago real
            setTimeout(async () => {
                try {
                    // Simular resultado aleatorio (95% éxito)
                    const exitoso = Math.random() > 0.05;
                    const nuevoEstado = exitoso ? 'Completed' : 'Failed';
                    
                    await sql.promise().query(
                        'UPDATE transactions SET stateTransaction = ?, completedDate = ?, updateTransaction = ? WHERE idTransaction = ?',
                        [nuevoEstado, new Date(), new Date().toLocaleString(), nuevaTransaccion.idTransaction]
                    );
                } catch (error) {
                    console.error('Error en procesamiento asíncrono:', error);
                }
            }, 3000); // Simular 3 segundos de procesamiento
        }

        return res.status(201).json({
            message: mensaje,
            transaction: {
                idTransaction: nuevaTransaccion.idTransaction,
                transactionNumber: transactionNumber,
                amount: parseFloat(amount),
                currency: currency || 'USD',
                paymentMethod: paymentMethod,
                status: estadoFinal,
                processorCommission: parseFloat(processorCommission)
            }
        });

    } catch (error) {
        console.error('Error al procesar pago:', error);
        return res.status(500).json({
            message: 'Error al procesar el pago',
            error: error.message
        });
    }
};

// Confirmar transacción
transactionsCtl.confirmarTransaccion = async (req, res) => {
    try {
        const { id } = req.params;
        const { externalReference, providerResponse } = req.body;

        // Verificar que la transacción existe
        const [transaccion] = await sql.promise().query(
            'SELECT * FROM transactions WHERE idTransaction = ?',
            [id]
        );

        if (transaccion.length === 0) {
            return res.status(404).json({ message: 'Transacción no encontrada' });
        }

        const transactionData = transaccion[0];

        if (transactionData.stateTransaction === 'Completed') {
            return res.status(400).json({ message: 'La transacción ya está completada' });
        }

        if (transactionData.stateTransaction === 'Failed') {
            return res.status(400).json({ message: 'La transacción ha fallado y no puede confirmarse' });
        }

        // Confirmar transacción
        await sql.promise().query(
            `UPDATE transactions SET 
                stateTransaction = 'Completed',
                externalReference = ?,
                completedDate = ?,
                updateTransaction = ?
             WHERE idTransaction = ?`,
            [externalReference || transactionData.externalReference, new Date(), new Date().toLocaleString(), id]
        );

        // Si hay una reserva asociada, actualizar su estado
        if (transactionData.reservationId) {
            await sql.promise().query(
                'UPDATE reservations SET stateReservation = "Paid", updateReservation = ? WHERE idReservation = ?',
                [new Date().toLocaleString(), transactionData.reservationId]
            );
        }

        return res.json({
            message: 'Transacción confirmada exitosamente',
            transactionNumber: transactionData.transactionNumber
        });

    } catch (error) {
        console.error('Error al confirmar transacción:', error);
        return res.status(500).json({ message: 'Error al confirmar transacción', error: error.message });
    }
};

// ================ GESTIÓN DE REEMBOLSOS ================

// Procesar reembolso
transactionsCtl.procesarReembolso = async (req, res) => {
    try {
        const { id } = req.params;
        const { refundAmount, refundReason } = req.body;

        // Obtener datos de la transacción
        const [transaccion] = await sql.promise().query(
            'SELECT * FROM transactions WHERE idTransaction = ?',
            [id]
        );

        if (transaccion.length === 0) {
            return res.status(404).json({ message: 'Transacción no encontrada' });
        }

        const transactionData = transaccion[0];

        if (transactionData.stateTransaction !== 'Completed') {
            return res.status(400).json({ message: 'Solo se pueden reembolsar transacciones completadas' });
        }

        const montoReembolso = refundAmount ? parseFloat(refundAmount) : transactionData.amount;

        if (montoReembolso > transactionData.amount) {
            return res.status(400).json({ message: 'El monto del reembolso no puede ser mayor al monto original' });
        }

        if (transactionData.refundAmount && (transactionData.refundAmount + montoReembolso) > transactionData.amount) {
            return res.status(400).json({ message: 'El reembolso total excedería el monto original' });
        }

        // Actualizar transacción con datos del reembolso
        const nuevoMontoReembolso = (transactionData.refundAmount || 0) + montoReembolso;
        const nuevoEstado = nuevoMontoReembolso >= transactionData.amount ? 'Refunded' : 'Completed';

        await sql.promise().query(
            `UPDATE transactions SET 
                stateTransaction = ?,
                refundAmount = ?,
                refundDate = ?,
                updateTransaction = ?
             WHERE idTransaction = ?`,
            [nuevoEstado, nuevoMontoReembolso, new Date(), new Date().toLocaleString(), id]
        );

        // Si hay una reserva asociada y es reembolso total, cancelar la reserva
        if (transactionData.reservationId && nuevoEstado === 'Refunded') {
            await sql.promise().query(
                'UPDATE reservations SET stateReservation = "Cancelled", updateReservation = ? WHERE idReservation = ?',
                [new Date().toLocaleString(), transactionData.reservationId]
            );
        }

        return res.json({
            message: 'Reembolso procesado exitosamente',
            transactionNumber: transactionData.transactionNumber,
            refundAmount: montoReembolso,
            totalRefunded: nuevoMontoReembolso,
            newStatus: nuevoEstado
        });

    } catch (error) {
        console.error('Error al procesar reembolso:', error);
        return res.status(500).json({ message: 'Error al procesar reembolso', error: error.message });
    }
};

// ================ CONSULTAS Y REPORTES ================

// Obtener historial de transacciones
transactionsCtl.obtenerHistorialTransacciones = async (req, res) => {
    try {
        const { usuarioId, startDate, endDate, status, paymentMethod, page = 1, limit = 20 } = req.query;

        let query = `
            SELECT t.*, u.nameUsers, u.emailUser,
                   CASE 
                       WHEN r.idReservation IS NOT NULL THEN 'cinema'
                       WHEN cr.idConcertReservation IS NOT NULL THEN 'concert'
                       WHEN tr.idTransportReservation IS NOT NULL THEN 'transport'
                       ELSE 'other'
                   END as reservationType
            FROM transactions t
            LEFT JOIN users u ON t.usuarioId = u.idUser
            LEFT JOIN reservations r ON t.reservationId = r.idReservation
            LEFT JOIN concertReservations cr ON t.reservationId = cr.idConcertReservation
            LEFT JOIN transportReservations tr ON t.reservationId = tr.idTransportReservation
            WHERE 1=1
        `;

        const params = [];

        if (usuarioId) {
            query += ' AND t.usuarioId = ?';
            params.push(usuarioId);
        }

        if (startDate) {
            query += ' AND DATE(t.processingDate) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(t.processingDate) <= ?';
            params.push(endDate);
        }

        if (status) {
            query += ' AND t.stateTransaction = ?';
            params.push(status);
        }

        if (paymentMethod) {
            query += ' AND t.paymentMethod = ?';
            params.push(paymentMethod);
        }

        query += ' ORDER BY t.processingDate DESC';

        // Paginación
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [transacciones] = await sql.promise().query(query, params);

        // Contar total para paginación
        let countQuery = query.replace(/SELECT t\.\*, u\.nameUsers, u\.emailUser,.*?FROM/, 'SELECT COUNT(*) as total FROM');
        countQuery = countQuery.replace(/ORDER BY.*?LIMIT.*?OFFSET.*?$/, '');
        const countParams = params.slice(0, -2); // Remover limit y offset

        const [totalCount] = await sql.promise().query(countQuery, countParams);

        const transaccionesCompletas = transacciones.map(transaccion => ({
            ...transaccion,
            nameUsers: descifrarSeguro(transaccion.nameUsers),
            emailUser: descifrarSeguro(transaccion.emailUser)
        }));

        return res.json({
            transacciones: transaccionesCompletas,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount[0].total / parseInt(limit)),
                totalRecords: totalCount[0].total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        return res.status(500).json({ message: 'Error al obtener historial', error: error.message });
    }
};

// Obtener transacción por ID
transactionsCtl.obtenerTransaccion = async (req, res) => {
    try {
        const { id } = req.params;

        const [transaccion] = await sql.promise().query(`
            SELECT t.*, u.nameUsers, u.emailUser, r.codeReservation
            FROM transactions t
            LEFT JOIN users u ON t.usuarioId = u.idUser
            LEFT JOIN reservations r ON t.reservationId = r.idReservation
            WHERE t.idTransaction = ?
        `, [id]);

        if (transaccion.length === 0) {
            return res.status(404).json({ message: 'Transacción no encontrada' });
        }

        const transactionData = {
            ...transaccion[0],
            nameUsers: descifrarSeguro(transaccion[0].nameUsers),
            emailUser: descifrarSeguro(transaccion[0].emailUser)
        };

        return res.json(transactionData);

    } catch (error) {
        console.error('Error al obtener transacción:', error);
        return res.status(500).json({ message: 'Error al obtener transacción', error: error.message });
    }
};

// ================ ESTADÍSTICAS DE VENTAS ================

// Obtener estadísticas de ventas
transactionsCtl.obtenerEstadisticasVentas = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        // Estadísticas generales
        let generalQuery = `
            SELECT 
                COUNT(*) as totalTransacciones,
                COUNT(CASE WHEN stateTransaction = 'Completed' THEN 1 END) as transaccionesExitosas,
                COUNT(CASE WHEN stateTransaction = 'Failed' THEN 1 END) as transaccionesFallidas,
                COUNT(CASE WHEN stateTransaction = 'Refunded' THEN 1 END) as transaccionesReembolsadas,
                SUM(CASE WHEN stateTransaction = 'Completed' THEN amount ELSE 0 END) as ingresoTotal,
                AVG(CASE WHEN stateTransaction = 'Completed' THEN amount ELSE NULL END) as ticketPromedio,
                SUM(CASE WHEN stateTransaction = 'Completed' THEN processorCommission ELSE 0 END) as comisionesTotales
            FROM transactions
            WHERE 1=1
        `;

        const generalParams = [];

        if (startDate) {
            generalQuery += ' AND DATE(processingDate) >= ?';
            generalParams.push(startDate);
        }

        if (endDate) {
            generalQuery += ' AND DATE(processingDate) <= ?';
            generalParams.push(endDate);
        }

        const [estadisticasGenerales] = await sql.promise().query(generalQuery, generalParams);

        // Ventas por período
        let dateFormat = '%Y-%m-%d';
        if (groupBy === 'month') dateFormat = '%Y-%m';
        if (groupBy === 'year') dateFormat = '%Y';

        let ventasPorPeriodoQuery = `
            SELECT 
                DATE_FORMAT(processingDate, '${dateFormat}') as periodo,
                COUNT(*) as transacciones,
                SUM(CASE WHEN stateTransaction = 'Completed' THEN amount ELSE 0 END) as ingresos,
                COUNT(CASE WHEN stateTransaction = 'Completed' THEN 1 END) as exitosas
            FROM transactions
            WHERE 1=1
        `;

        if (startDate) {
            ventasPorPeriodoQuery += ' AND DATE(processingDate) >= ?';
        }

        if (endDate) {
            ventasPorPeriodoQuery += ' AND DATE(processingDate) <= ?';
        }

        ventasPorPeriodoQuery += ` GROUP BY periodo ORDER BY periodo DESC LIMIT 30`;

        const [ventasPorPeriodo] = await sql.promise().query(ventasPorPeriodoQuery, generalParams);

        // Ventas por método de pago
        let ventasPorMetodoQuery = `
            SELECT 
                paymentMethod,
                COUNT(*) as transacciones,
                SUM(CASE WHEN stateTransaction = 'Completed' THEN amount ELSE 0 END) as ingresos,
                ROUND(AVG(CASE WHEN stateTransaction = 'Completed' THEN amount ELSE NULL END), 2) as promedioTransaccion
            FROM transactions
            WHERE 1=1
        `;

        if (startDate) {
            ventasPorMetodoQuery += ' AND DATE(processingDate) >= ?';
        }

        if (endDate) {
            ventasPorMetodoQuery += ' AND DATE(processingDate) <= ?';
        }

        ventasPorMetodoQuery += ' GROUP BY paymentMethod ORDER BY ingresos DESC';

        const [ventasPorMetodo] = await sql.promise().query(ventasPorMetodoQuery, generalParams);

        return res.json({
            resumen: {
                ...estadisticasGenerales[0],
                ingresoTotal: parseFloat(estadisticasGenerales[0].ingresoTotal || 0),
                ticketPromedio: parseFloat(estadisticasGenerales[0].ticketPromedio || 0),
                comisionesTotales: parseFloat(estadisticasGenerales[0].comisionesTotales || 0),
                tasaExito: estadisticasGenerales[0].totalTransacciones > 0 
                    ? ((estadisticasGenerales[0].transaccionesExitosas / estadisticasGenerales[0].totalTransacciones) * 100).toFixed(2)
                    : 0
            },
            ventasPorPeriodo: ventasPorPeriodo.map(venta => ({
                ...venta,
                ingresos: parseFloat(venta.ingresos || 0)
            })),
            ventasPorMetodo: ventasPorMetodo.map(metodo => ({
                ...metodo,
                ingresos: parseFloat(metodo.ingresos || 0)
            }))
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// ================ INTEGRACIÓN CON PASARELAS ================

// Webhook para notificaciones de pasarelas de pago
transactionsCtl.webhookPasarela = async (req, res) => {
    try {
        const { transactionNumber, status, externalReference, providerData } = req.body;

        // Validar webhook (en producción, verificar firma)
        if (!transactionNumber || !status) {
            return res.status(400).json({ message: 'Datos del webhook incompletos' });
        }

        // Buscar transacción
        const [transaccion] = await sql.promise().query(
            'SELECT * FROM transactions WHERE transactionNumber = ?',
            [transactionNumber]
        );

        if (transaccion.length === 0) {
            return res.status(404).json({ message: 'Transacción no encontrada' });
        }

        const transactionData = transaccion[0];

        // Mapear estados de la pasarela a nuestros estados
        let nuevoEstado = transactionData.stateTransaction;
        
        switch (status.toLowerCase()) {
            case 'approved':
            case 'completed':
            case 'success':
                nuevoEstado = 'Completed';
                break;
            case 'rejected':
            case 'failed':
            case 'error':
                nuevoEstado = 'Failed';
                break;
            case 'pending':
            case 'processing':
                nuevoEstado = 'Processing';
                break;
        }

        // Actualizar transacción
        await sql.promise().query(
            `UPDATE transactions SET 
                stateTransaction = ?,
                externalReference = ?,
                ${nuevoEstado === 'Completed' ? 'completedDate = ?,' : ''}
                updateTransaction = ?
             WHERE transactionNumber = ?`,
            nuevoEstado === 'Completed' 
                ? [nuevoEstado, externalReference || transactionData.externalReference, new Date(), new Date().toLocaleString(), transactionNumber]
                : [nuevoEstado, externalReference || transactionData.externalReference, new Date().toLocaleString(), transactionNumber]
        );

        // Si se completó y hay reserva, actualizar estado de reserva
        if (nuevoEstado === 'Completed' && transactionData.reservationId) {
            await sql.promise().query(
                'UPDATE reservations SET stateReservation = "Paid", updateReservation = ? WHERE idReservation = ?',
                [new Date().toLocaleString(), transactionData.reservationId]
            );
        }

        return res.json({ 
            message: 'Webhook procesado exitosamente',
            transactionNumber: transactionNumber,
            newStatus: nuevoEstado
        });

    } catch (error) {
        console.error('Error al procesar webhook:', error);
        return res.status(500).json({ message: 'Error al procesar webhook', error: error.message });
    }
};

// ================ FUNCIONES AUXILIARES ================

// Validar estado de transacción
transactionsCtl.validarEstadoTransaccion = async (req, res) => {
    try {
        const { transactionNumber } = req.params;

        const [transaccion] = await sql.promise().query(
            'SELECT transactionNumber, stateTransaction, amount, currency, processingDate, completedDate FROM transactions WHERE transactionNumber = ?',
            [transactionNumber]
        );

        if (transaccion.length === 0) {
            return res.status(404).json({ message: 'Transacción no encontrada' });
        }

        return res.json({
            transactionNumber: transaccion[0].transactionNumber,
            status: transaccion[0].stateTransaction,
            amount: transaccion[0].amount,
            currency: transaccion[0].currency,
            processingDate: transaccion[0].processingDate,
            completedDate: transaccion[0].completedDate,
            isCompleted: transaccion[0].stateTransaction === 'Completed',
            isFailed: transaccion[0].stateTransaction === 'Failed'
        });

    } catch (error) {
        console.error('Error al validar estado:', error);
        return res.status(500).json({ message: 'Error al validar estado', error: error.message });
    }
};

// Cancelar transacción pendiente
transactionsCtl.cancelarTransaccion = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        const [transaccion] = await sql.promise().query(
            'SELECT stateTransaction FROM transactions WHERE idTransaction = ?',
            [id]
        );

        if (transaccion.length === 0) {
            return res.status(404).json({ message: 'Transacción no encontrada' });
        }

        if (!['Pending', 'Processing'].includes(transaccion[0].stateTransaction)) {
            return res.status(400).json({ message: 'Solo se pueden cancelar transacciones pendientes o en procesamiento' });
        }

        await sql.promise().query(
            'UPDATE transactions SET stateTransaction = "Failed", updateTransaction = ? WHERE idTransaction = ?',
            [new Date().toLocaleString(), id]
        );

        return res.json({ message: 'Transacción cancelada exitosamente' });

    } catch (error) {
        console.error('Error al cancelar transacción:', error);
        return res.status(500).json({ message: 'Error al cancelar transacción', error: error.message });
    }
};

module.exports = transactionsCtl;