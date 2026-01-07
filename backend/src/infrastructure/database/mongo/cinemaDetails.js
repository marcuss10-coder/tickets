const mongoose = require('mongoose');

const cinemaDetailsSchema = new mongoose.Schema({
    imageUrl: String,
    openingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    services: [{
        type: String,
        enum: ['IMAX', '3D', 'VIP', 'DolbyAtmos', 'Parking', 'Restaurant', 'WiFi']
    }],
    features: {
        parking: Boolean,
        wifi: Boolean,
        restaurant: Boolean,
        accessibility: Boolean,
        airConditioning: Boolean
    },
    socialMedia: {
        facebook: String,
        instagram: String,
        twitter: String,
        website: String
    },
    description: String,
    gallery: [String],
    idCinemaSql: String
}, {
    timestamps: true,
    collection: 'cinemaDetails'
});
// Verificar si el modelo ya existe antes de crearlo
const CinemaDetails = mongoose.models.CinemaDetails || mongoose.model('CinemaDetails', cinemaDetailsSchema);
module.exports = CinemaDetails;
