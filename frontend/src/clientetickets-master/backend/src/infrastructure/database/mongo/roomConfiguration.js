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

// Verificar si el modelo ya existe antes de crearlo
const RoomConfiguration = mongoose.models.RoomConfiguration || mongoose.model('RoomConfiguration', roomConfigurationSchema);
module.exports = RoomConfiguration;
