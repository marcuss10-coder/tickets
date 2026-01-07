const mongoose = require('mongoose');

const movieMetadataSchema = new mongoose.Schema({
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
    idMovieSql: String
}, {
    timestamps: true,
    collection: 'movieMetadata'
});

const MovieMetadata = mongoose.model('MovieMetadata', movieMetadataSchema);
module.exports = MovieMetadata;