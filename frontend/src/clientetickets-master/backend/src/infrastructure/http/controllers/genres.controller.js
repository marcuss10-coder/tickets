const genreCtl = {};
const orm = require('../../../infrastructure/database/connection/dataBase.orm');

// Mostrar todos los géneros
genreCtl.mostrarGeneros = async (req, res) => {
    try {
        const listaGeneros = await orm.genres.findAll();
        return res.json(listaGeneros);
    } catch (error) {
        console.error('Error al mostrar géneros:', error);
        return res.status(500).json({ message: 'Error al obtener los géneros', error: error.message });
    }
};

// Crear nuevo género
genreCtl.crearGenero = async (req, res) => {
    try {
        const { nameGenre, descriptionGenre, colorHex } = req.body;

        // Validación de campos requeridos
        if (!nameGenre) {
            return res.status(400).json({ message: 'El nombre del género es obligatorio' });
        }

        const nuevoGenero = await orm.genres.create({
            nameGenre,
            descriptionGenre,
            colorHex,
            createGenre: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Género creado exitosamente',
            idGenre: nuevoGenero.idGenre
        });

    } catch (error) {
        console.error('Error al crear género:', error);
        return res.status(500).json({ 
            message: 'Error al crear el género', 
            error: error.message 
        });
    }
};

// Actualizar género
genreCtl.actualizarGenero = async (req, res) => {
    try {
        const { id } = req.params;
        const { nameGenre, descriptionGenre, colorHex } = req.body;

        // Validar campos
        if (!nameGenre) {
            return res.status(400).json({ message: 'El nombre del género es obligatorio' });
        }

        await orm.genres.update(
            {
                nameGenre,
                descriptionGenre,
                colorHex,
                updateGenre: new Date().toLocaleString(),
            },
            { where: { idGenre: id } }
        );

        return res.json({ message: 'Género actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar género:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Eliminar (desactivar) género
genreCtl.eliminarGenero = async (req, res) => {
    try {
        const { id } = req.params;

        await orm.genres.update(
            {
                stateGenre: false,
                updateGenre: new Date().toLocaleString(),
            },
            { where: { idGenre: id } }
        );

        return res.json({ message: 'Género desactivado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar género:', error);
        return res.status(500).json({ message: 'Error al desactivar', error: error.message });
    }
};

module.exports = genreCtl;
