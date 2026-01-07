const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['theme', 'typography', 'general', 'business', 'payment'],
        required: true
    },
    colors: {
        primary: String,
        secondary: String,
        accent: String,
        background: {
            from: String,
            via: String,
            to: String
        },
        text: {
            primary: String,
            secondary: String
        },
        borders: String,
        success: String,
        error: String,
        warning: String
    },
    typography: {
        primary: String,
        secondary: String,
        monospace: String,
        sizes: {
            small: String,
            normal: String,
            medium: String,
            large: String,
            extraLarge: String
        },
        weights: {
            light: String,
            normal: String,
            medium: String,
            semiBold: String,
            bold: String
        },
        lineHeights: {
            compact: String,
            normal: String,
            relaxed: String,
            loose: String
        }
    },
    businessConfig: {
        serviceFee: Number,
        reservationExpirationMinutes: Number,
        maxSeatsPerReservation: Number,
        allowGuestReservations: Boolean,
        requireEmailVerification: Boolean,
        enableLoyaltyProgram: Boolean
    },
    paymentConfig: {
        enabledMethods: [String],
        defaultCurrency: String,
        enableRefunds: Boolean,
        refundPolicyDays: Number
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'systemSettings'
});

// Verificar si el modelo ya existe antes de crearlo
const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', systemSettingsSchema);
module.exports = SystemSettings;
