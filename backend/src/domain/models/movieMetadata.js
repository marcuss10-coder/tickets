// Importamos mongoose UNA SOLA VEZ al principio
const mongoose = require('mongoose');

// Definimos UN SOLO esquema con TODOS los campos
const movieMetadataSchema = new mongoose.Schema({
    // CAMPOS ORIGINALES que ya tenías
    posterImage: String,
    backdropImage: String,
    trailerUrl: String,
    gallery: [String],
    subtitles: [String],
    formats: [String],
    cast: [{
        name: String,
        character: String,
        image: String,
        order: Number
    }],
    director: {
        name: String,
        image: String,
        biography: String
    },
    production: {
        studio: String,
        producers: [String],
        writers: [String]
    },
    technicalSpecs: {
        aspectRatio: String,
        soundMix: String,
        color: String,
        filmingLocations: [String]
    },
    awards: [{
        name: String,
        category: String,
        year: Number,
        won: Boolean
    }],
    trivia: [String],
    quotes: [String],
    goofs: [String],
    soundtrack: [{
        title: String,
        artist: String,
        duration: String
    }],
    idMovieSql: String,

    // CAMPOS NUEVOS que necesitas para el CRUD
    titulo: String,
    sinopsis: String,
    fechaHora: Date,
    sala: String,
    precio: Number,
    trailer: String // Si quieres usar trailerUrl en lugar de trailer, puedes cambiar el nombre para no duplicar
}, {
    timestamps: true,
    collection: 'movieMetadata'
});

// Exportamos el modelo UNA SOLA VEZ
const MovieMetadata = mongoose.model('MovieMetadata', movieMetadataSchema);
module.exports = MovieMetadata;