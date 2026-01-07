const mongoose = require('mongoose');

const concertMetadataSchema = new mongoose.Schema({
    setlist: [{
        songTitle: String,
        duration: String,
        order: Number,
        isEnccore: Boolean
    }],
    bandMembers: [{
        name: String,
        instrument: String,
        role: String,
        image: String
    }],
    technicalRequirements: {
        soundSystem: String,
        lightingRig: String,
        stageSize: String,
        powerRequirements: String,
        specialEffects: [String]
    },
    merchandising: [{
        item: String,
        price: Number,
        description: String,
        image: String
    }],
    socialMedia: {
        hashtags: [String],
        liveStream: {
            platform: String,
            url: String,
            startTime: Date
        }
    },
    weatherConsiderations: {
        isOutdoor: Boolean,
        weatherBackup: String,
        temperatureRange: String
    },
    historicalData: {
        previousVenues: [String],
        attendanceHistory: [{
            date: Date,
            venue: String,
            attendance: Number
        }]
    },
    idConcertSql: String
}, {
    timestamps: true,
    collection: 'concertMetadata'
});

const ConcertMetadata = mongoose.model('ConcertMetadata', concertMetadataSchema);
module.exports = ConcertMetadata;