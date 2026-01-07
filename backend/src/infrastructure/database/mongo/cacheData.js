const mongoose = require('mongoose');

const cacheDataSchema = new mongoose.Schema({
    key: {
        type: String,
        unique: true,
        required: true
    },
    value: mongoose.Schema.Types.Mixed,
    type: {
        type: String,
        enum: ['movie_details', 'cinema_info', 'user_preferences', 'search_results', 'recommendations'],
        required: true
    },
    ttl: Date,
    tags: [String],
    size: Number,
    hitCount: {
        type: Number,
        default: 0
    },
    lastAccess: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'cacheData'
});
// Verificar si el modelo ya existe antes de crearlo
const CacheData = mongoose.models.CacheData || mongoose.model('CacheData', cacheDataSchema);
module.exports = CacheData;
