const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: String,
    type: {
        type: String,
        enum: ['Reservation', 'Promotion', 'Reminder', 'System', 'Marketing'],
        required: true
    },
    title: String,
    message: String,
    additionalData: mongoose.Schema.Types.Mixed,
    read: {
        type: Boolean,
        default: false
    },
    sentEmail: {
        type: Boolean,
        default: false
    },
    sentPush: {
        type: Boolean,
        default: false
    },
    scheduledDate: Date,
    sentDate: Date,
    channels: [{
        type: String,
        enum: ['email', 'push', 'sms', 'in-app']
    }],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    }
}, {
    timestamps: true,
    collection: 'notifications'
});

// Verificar si el modelo ya existe antes de crearlo
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
module.exports = Notification;
