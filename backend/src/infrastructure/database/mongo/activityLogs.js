const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: String,
    action: String,
    entityType: String,
    entityId: String,
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    sessionId: String,
    location: {
        country: String,
        city: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    }
}, {
    timestamps: true,
    collection: 'activityLogs'
});

// Verificar si el modelo ya existe antes de crearlo
const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
module.exports = ActivityLog;
