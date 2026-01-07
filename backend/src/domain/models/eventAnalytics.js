const mongoose = require('mongoose');

const eventAnalyticsSchema = new mongoose.Schema({
    eventId: String,
    eventType: {
        type: String,
        enum: ['cinema', 'concert', 'transport'],
        required: true
    },
    date: Date,
    metrics: {
        totalAttendees: Number,
        revenue: Number,
        averageRating: Number,
        conversionRate: Number,
        refundRate: Number,
        noShowRate: Number
    },
    demographics: {
        ageGroups: [{
            range: String,
            count: Number,
            percentage: Number
        }],
        genderDistribution: {
            male: Number,
            female: Number,
            other: Number
        },
        geographicDistribution: [{
            location: String,
            count: Number,
            percentage: Number
        }]
    },
    salesData: {
        advanceSales: [{
            daysBeforeEvent: Number,
            ticketsSold: Number,
            revenue: Number
        }],
        peakSalesHours: [{
            hour: Number,
            sales: Number
        }],
        paymentMethodUsage: [{
            method: String,
            count: Number,
            percentage: Number
        }]
    },
    customerFeedback: {
        averageRating: Number,
        totalReviews: Number,
        sentimentScore: Number,
        commonComplaints: [String],
        commonPraises: [String]
    },
    operationalMetrics: {
        checkInTime: Number,
        averageWaitTime: Number,
        staffEfficiency: Number,
        equipmentDowntime: Number
    }
}, {
    timestamps: true,
    collection: 'eventAnalytics'
});
const EventAnalytics = mongoose.model('EventAnalytics', eventAnalyticsSchema);
module.exports = EventAnalytics;