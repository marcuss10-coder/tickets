const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true
    },
    name: String,
    description: String,
    discountType: {
        type: String,
        enum: ['Percentage', 'FixedAmount', 'Combo'],
        required: true
    },
    discountValue: Number,
    minimumAmount: Number,
    maxTotalUses: Number,
    maxUsesPerUser: {
        type: Number,
        default: 1
    },
    currentUses: {
        type: Number,
        default: 0
    },
    startDate: Date,
    endDate: Date,
    appliesTo: {
        type: String,
        enum: ['Tickets', 'Products', 'Total'],
        default: 'Total'
    },
    applicableCinemas: [String],
    applicableMovies: [String],
    applicableDays: [Number],
    timeRestrictions: {
        startTime: String,
        endTime: String
    },
    targetAudience: {
        vipStatus: [String],
        ageRange: {
            min: Number,
            max: Number
        },
        newUsers: Boolean
    },
    usageTracking: [{
        userId: String,
        usedAt: Date,
        appliedDiscount: Number,
        reservationId: String
    }],
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'promotions'
});

const Promotion = mongoose.model('Promotion', promotionSchema);
module.exports = Promotion;