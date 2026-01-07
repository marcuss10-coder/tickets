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

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
module.exports = ActivityLog;