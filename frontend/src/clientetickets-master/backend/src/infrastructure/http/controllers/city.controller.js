const cityCtl = {};
const orm = require('../../../infrastructure/database/connection/dataBase.orm');

// Mostrar todas las ciudades
cityCtl.mostrarCiudades = async (req, res) => {
    try {
        const listaCiudades = await orm.cities.findAll();
        return res.json(listaCiudades);
    } catch (error) {
        console.error('Error al mostrar ciudades:', error);
        return res.status(500).json({ message: 'Error al obtener las ciudades', error: error.message });
    }
};

// Crear nueva ciudad
cityCtl.crearCiudad = async (req, res) => {
    try {
        const { nameCity, postalCode } = req.body;

        // Validación de campos requeridos
        if (!nameCity || !postalCode) {
            return res.status(400).json({ message: 'El nombre y el código postal de la ciudad son obligatorios' });
        }

        const nuevaCiudad = await orm.cities.create({
            nameCity,
            postalCode,
            createCity: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Ciudad creada exitosamente',
            idCity: nuevaCiudad.idCity
        });

    } catch (error) {
        console.error('Error al crear ciudad:', error);
        return res.status(500).json({ 
            message: 'Error al crear la ciudad', 
            error: error.message 
        });
    }
};

// Actualizar ciudad
cityCtl.actualizarCiudad = async (req, res) => {
    try {
        const { id } = req.params;
        const { nameCity, postalCode } = req.body;

        // Validar campos
        if (!nameCity || !postalCode) {
            return res.status(400).json({ message: 'El nombre y el código postal de la ciudad son obligatorios' });
        }

        await orm.cities.update(
            {
                nameCity,
                postalCode,
                updateCity: new Date().toLocaleString(),
            },
            { where: { idCity: id } }
        );

        return res.json({ message: 'Ciudad actualizada exitosamente' });

    } catch (error) {
        console.error('Error al actualizar ciudad:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Eliminar (desactivar) ciudad
cityCtl.eliminarCiudad = async (req, res) => {
    try {
        const { id } = req.params;

        await orm.cities.update(
            {
                stateCity: false,
                updateCity: new Date().toLocaleString(),
            },
            { where: { idCity: id } }
        );

        return res.json({ message: 'Ciudad desactivada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar ciudad:', error);
        return res.status(500).json({ message: 'Error al desactivar', error: error.message });
    }
};

module.exports = cityCtl;
