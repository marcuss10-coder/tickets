const mongoose = require('mongoose');

const roomConfigurationSchema = new mongoose.Schema({
    seatsPerRow: [Number],
    technology: [String],
    seatConfiguration: {
        layout: String,
        accessibility: {
            wheelchairSeats: [String],
            companionSeats: [String]
        },
        vipSection: {
            rows: [String],
            amenities: [String]
        }
    },
    amenities: {
        soundSystem: String,
        projectionType: String,
        screenSize: String,
        specialFeatures: [String]
    },
    maintenanceSchedule: {
        lastMaintenance: Date,
        nextMaintenance: Date,
        maintenanceType: String,
        notes: String
    },
    idRoomSql: String
}, {
    timestamps: true,
    collection: 'roomConfigurations'
});

const RoomConfiguration = mongoose.model('RoomConfiguration', roomConfigurationSchema);
module.exports = RoomConfiguration;