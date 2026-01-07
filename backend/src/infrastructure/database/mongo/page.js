const mongoose = require('mongoose')

const pageSchema = new mongoose.Schema({
    visionPage: String,
    misionPage: String,
    celularPage: String,
    correoPagina: String,
    createPageMongo: String,
    updatePageMongo: String,
    idPageSql: String
}, {
    timestamps: false,
    collection: 'pages'
})

// Verificar si el modelo ya existe antes de crearlo
const page = mongoose.models.pages || mongoose.model('pages', pageSchema)

module.exports = page
