const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: ['info', 'warning', 'error', 'debug'],
        default: 'info'
    },
    message: String,
    service: String,
    module: String,
    stackTrace: String,
    requestId: String,
    userId: String,
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'systemLogs'
});

const SystemLog = mongoose.model('SystemLog', systemLogSchema);
module.exports = SystemLog;
