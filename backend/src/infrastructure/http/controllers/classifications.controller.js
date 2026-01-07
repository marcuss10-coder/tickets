const classificationCtl = {};
const orm = require('../../../infrastructure/database/connection/dataBase.orm');

// Mostrar todas las clasificaciones
classificationCtl.mostrarClasificaciones = async (req, res) => {
    try {
        const listaClasificaciones = await orm.classifications.findAll();
        return res.json(listaClasificaciones);
    } catch (error) {
        console.error('Error al mostrar clasificaciones:', error);
        return res.status(500).json({ message: 'Error al obtener las clasificaciones', error: error.message });
    }
};

// Crear nueva clasificación
classificationCtl.crearClasificacion = async (req, res) => {
    try {
        const { codeClassification, nameClassification, descriptionClassification, minimumAge, requiresCompanion } = req.body;

        // Validación de campos requeridos
        if (!codeClassification || !nameClassification) {
            return res.status(400).json({ message: 'El código y el nombre de la clasificación son obligatorios' });
        }

        const nuevaClasificacion = await orm.classifications.create({
            codeClassification,
            nameClassification,
            descriptionClassification,
            minimumAge,
            requiresCompanion,
            createClassification: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Clasificación creada exitosamente',
            idClassification: nuevaClasificacion.idClassification
        });

    } catch (error) {
        console.error('Error al crear clasificación:', error);
        return res.status(500).json({ 
            message: 'Error al crear la clasificación', 
            error: error.message 
        });
    }
};

// Actualizar clasificación
classificationCtl.actualizarClasificacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { codeClassification, nameClassification, descriptionClassification, minimumAge, requiresCompanion } = req.body;

        // Validar campos
        if (!codeClassification || !nameClassification) {
            return res.status(400).json({ message: 'El código y el nombre de la clasificación son obligatorios' });
        }

        await orm.classifications.update(
            {
                codeClassification,
                nameClassification,
                descriptionClassification,
                minimumAge,
                requiresCompanion,
                updateClassification: new Date().toLocaleString(),
            },
            { where: { idClassification: id } }
        );

        return res.json({ message: 'Clasificación actualizada exitosamente' });

    } catch (error) {
        console.error('Error al actualizar clasificación:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Eliminar (desactivar) clasificación
classificationCtl.eliminarClasificacion = async (req, res) => {
    try {
        const { id } = req.params;

        await orm.classifications.update(
            {
                stateClassification: false,
                updateClassification: new Date().toLocaleString(),
            },
            { where: { idClassification: id } }
        );

        return res.json({ message: 'Clasificación desactivada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar clasificación:', error);
        return res.status(500).json({ message: 'Error al desactivar', error: error.message });
    }
};

module.exports = classificationCtl;
