const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema({
    date: Date,
    type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: true
    },
    cinemaId: String,
    movieId: String,
    metrics: {
        totalReservations: {
            type: Number,
            default: 0
        },
        totalRevenue: {
            type: Number,
            default: 0
        },
        totalSeatsSold: {
            type: Number,
            default: 0
        },
        totalProductsSold: {
            type: Number,
            default: 0
        },
        averageOccupancy: {
            type: Number,
            default: 0
        },
        ticketRevenue: {
            type: Number,
            default: 0
        },
        productRevenue: {
            type: Number,
            default: 0
        },
        newUsers: {
            type: Number,
            default: 0
        },
        returningUsers: {
            type: Number,
            default: 0
        },
        averageTicketPrice: {
            type: Number,
            default: 0
        },
        averageSpendPerUser: {
            type: Number,
            default: 0
        }
    },
    popularItems: {
        movies: [{
            id: String,
            title: String,
            totalSales: Number,
            revenue: Number
        }],
        products: [{
            id: String,
            name: String,
            totalSold: Number,
            revenue: Number
        }],
        timeSlots: [{
            time: String,
            totalReservations: Number,
            occupancyRate: Number
        }]
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
        vipStatusDistribution: {
            bronze: Number,
            silver: Number,
            gold: Number,
            platinum: Number
        }
    },
    paymentMethods: [{
        method: String,
        count: Number,
        percentage: Number,
        totalAmount: Number
    }],
    deviceUsage: [{
        type: String,
        count: Number,
        percentage: Number
    }],
    peakHours: [{
        hour: Number,
        reservations: Number,
        revenue: Number
    }]
}, {
    timestamps: true,
    collection: 'statistics'
});

const Statistics = mongoose.model('Statistics', statisticsSchema);
module.exports = Statistics;