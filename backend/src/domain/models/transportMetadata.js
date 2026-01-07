const mongoose = require('mongoose');

const transportMetadataSchema = new mongoose.Schema({
    routeDetails: {
        gpsCoordinates: [{
            latitude: Number,
            longitude: Number,
            stopName: String,
            estimatedTime: String
        }],
        trafficPatterns: [{
            timeRange: String,
            congestionLevel: String,
            alternativeRoutes: [String]
        }],
        weatherImpact: {
            rainDelayMinutes: Number,
            snowCancellation: Boolean,
            windSpeedLimit: Number
        }
    },
    vehicleFeatures: {
        wifi: Boolean,
        airConditioning: Boolean,
        entertainment: [String],
        accessibility: {
            wheelchairAccessible: Boolean,
            audioAnnouncements: Boolean,
            visualDisplays: Boolean
        },
        safety: {
            emergencyExits: Number,
            firstAidKit: Boolean,
            securityCameras: Boolean
        }
    },
    serviceLevel: {
        punctualityScore: Number,
        cleanlinessRating: Number,
        customerSatisfaction: Number,
        lastInspection: Date
    },
    realTimeTracking: {
        currentLocation: {
            latitude: Number,
            longitude: Number,
            lastUpdate: Date
        },
        estimatedArrival: Date,
        delayStatus: String,
        passengerCount: Number
    },
    operationalNotes: {
        maintenanceSchedule: [{
            type: String,
            date: Date,
            description: String
        }],
        driverNotes: String,
        routeHazards: [String]
    },
    idTransportSql: String
}, {
    timestamps: true,
    collection: 'transportMetadata'
});

const TransportMetadata = mongoose.model('TransportMetadata', transportMetadataSchema);
module.exports = TransportMetadata;