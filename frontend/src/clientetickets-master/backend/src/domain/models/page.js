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

const page = mongoose.model('pages', pageSchema)

module.exports = page