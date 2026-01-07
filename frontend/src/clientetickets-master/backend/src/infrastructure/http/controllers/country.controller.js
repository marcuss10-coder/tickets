const countryCtl = {};
const orm = require('../../../infrastructure/database/connection/dataBase.orm');

// Mostrar todos los países
countryCtl.mostrarPaises = async (req, res) => {
    try {
        const listaPaises = await orm.countries.findAll();
        return res.json(listaPaises);
    } catch (error) {
        console.error('Error al mostrar países:', error);
        return res.status(500).json({ message: 'Error al obtener los países', error: error.message });
    }
};

// Crear nuevo país
countryCtl.crearPais = async (req, res) => {
    try {
        const { isoCode, nameCountry } = req.body;

        // Validación de campos requeridos
        if (!isoCode || !nameCountry) {
            return res.status(400).json({ message: 'El código ISO y el nombre del país son obligatorios' });
        }

        const nuevoPais = await orm.countries.create({
            isoCode,
            nameCountry,
            createCountry: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'País creado exitosamente',
            idCountry: nuevoPais.idCountry
        });

    } catch (error) {
        console.error('Error al crear país:', error);
        return res.status(500).json({ 
            message: 'Error al crear el país', 
            error: error.message 
        });
    }
};

// Actualizar país
countryCtl.actualizarPais = async (req, res) => {
    try {
        const { id } = req.params;
        const { isoCode, nameCountry } = req.body;

        // Validar campos
        if (!isoCode || !nameCountry) {
            return res.status(400).json({ message: 'El código ISO y el nombre del país son obligatorios' });
        }

        await orm.countries.update(
            {
                isoCode,
                nameCountry,
                updateCountry: new Date().toLocaleString(),
            },
            { where: { idCountry: id } }
        );

        return res.json({ message: 'País actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar país:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Eliminar (desactivar) país
countryCtl.eliminarPais = async (req, res) => {
    try {
        const { id } = req.params;

        await orm.countries.update(
            {
                stateCountry: false,
                updateCountry: new Date().toLocaleString(),
            },
            { where: { idCountry: id } }
        );

        return res.json({ message: 'País desactivado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar país:', error);
        return res.status(500).json({ message: 'Error al desactivar', error: error.message });
    }
};

module.exports = countryCtl;
