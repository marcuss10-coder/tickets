const mongoose = require('mongoose');

const eventSettingsSchema = new mongoose.Schema({
     eventIdMysql: {
        type: Number,
        required: true,
        index: true
    },
    eventType: {
        type: String,
        enum: ['cinema', 'concert', 'transport'],
        required: true
    },
    generalSettings: {
        maxReservationsPerUser: Number,
        reservationExpirationMinutes: Number,
        cancellationPolicy: {
            hoursBeforeEvent: Number,
            refundPercentage: Number,
            processingFee: Number
        },
        ageRestrictions: {
            minimumAge: Number,
            requiresGuardian: Boolean
        }
    },
    pricingSettings: {
        dynamicPricing: {
            enabled: Boolean,
            priceMultipliers: [{
                condition: String,
                multiplier: Number
            }]
        },
        discountPolicies: [{
            type: String,
            percentage: Number,
            conditions: [String]
        }],
        taxConfiguration: {
            taxRate: Number,
            taxIncluded: Boolean
        }
    },
    notificationSettings: {
        reminderTimes: [Number], // Horas antes del evento
        emailTemplates: {
            confirmation: String,
            reminder: String,
            cancellation: String
        },
        smsEnabled: Boolean,
        pushNotificationsEnabled: Boolean
    },
    capacityManagement: {
        overbookingPercentage: Number,
        waitlistEnabled: Boolean,
        maxWaitlistSize: Number,
        autoReleaseMinutes: Number
    },
    accessibilitySettings: {
        wheelchairSeats: Number,
        hearingImpairedSupport: Boolean,
        visuallyImpairedSupport: Boolean,
        signLanguageInterpreter: Boolean
    },
    securitySettings: {
        idRequired: Boolean,
        bagCheckRequired: Boolean,
        metalDetector: Boolean,
        prohibitedItems: [String]
    }
}, {
    timestamps: true,
    collection: 'eventSettings'
});

// Verificar si el modelo ya existe antes de crearlo
const EventSettings = mongoose.models.EventSettings || mongoose.model('EventSettings', eventSettingsSchema);
module.exports = EventSettings;
