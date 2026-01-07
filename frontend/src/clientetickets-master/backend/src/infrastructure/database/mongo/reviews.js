const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    entityType: {
        type: String,
        enum: ['movie', 'cinema'],
        required: true
    },
    entityId: String,
    userId: String,
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    title: String,
    comment: String,
    containsSpoilers: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    },
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    },
    reported: {
        type: Boolean,
        default: false
    },
    approved: {
        type: Boolean,
        default: true
    },
    viewingDate: Date,
    aspects: {
        sound: Number,
        image: Number,
        comfort: Number,
        cleanliness: Number,
        service: Number
    },
    helpfulVotes: {
        type: Number,
        default: 0
    },
    reportReasons: [String]
}, {
    timestamps: true,
    collection: 'reviews'
});

// Verificar si el modelo ya existe antes de crearlo
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);  
module.exports = Review;
