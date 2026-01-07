const mongoose = require('mongoose');
const { MONGODB_URI } = require('../../../config/keys');

// 1. Configuración de eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose conectado a MongoDB en:', mongoose.connection.host);
});

mongoose.connection.on('error', (err) => { 
  console.error('❌ Error de conexión en Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose desconectado de MongoDB');
});

// 2. Función de conexión mejorada
const connectDB = async () => {
  try {
    // Codificar contraseña por si contiene caracteres especiales
    const encodedPassword = encodeURIComponent('0987021692@Rj');
    const connectionURI = MONGODB_URI.replace('<PASSWORD>', encodedPassword);

    await mongoose.connect(connectionURI, {
      connectTimeoutMS: 10000, // 10 segundos de timeout
      socketTimeoutMS: 45000, // 45 segundos
    });
    
    console.log('🚀 MongoDB conectado correctamente');
  } catch (err) {
    console.error('💥 FALLA CRÍTICA en conexión MongoDB:', err.message);
    process.exit(1); // Termina la aplicación con error
  }
};

// 3. Manejo de cierre de aplicación
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada por terminación de la app');
    process.exit(0);
  } catch (err) {
    console.error('Error al cerrar conexión MongoDB:', err);
    process.exit(1);
  }
});

// 4. Iniciar conexión inmediatamente (como solicitaste)
connectDB();

// 5. Exportar modelos (ajusta las rutas según tu estructura)
const pageModel = require('../../../domain/models/page');
const concertModel = require('../../../domain/models/concertMetadata');
const activityLogModel = require('../../../domain/models/activityLogs');
const cacheModel = require('../../../domain/models/cacheData');
const cinemaModel = require('../../../domain/models/cinemaDetails');
const clienteModel = require('../../../domain/models/cliente');
const concertsModel = require('../../../domain/models/concertMetadata');
const eventAnalyticsModel = require('../../../domain/models/eventAnalytics');
const eventSettingsModel = require('../../../domain/models/eventSettings');
const movieMetadataModel = require('../../../domain/models/movieMetadata');
const notificationModel = require('../../../domain/models/notifications');
const promotionsModel = require('../../../domain/models/promotions');
const reviewsModel = require('../../../domain/models/reviews');
const roomConfigModel = require('../../../domain/models/roomConfiguration');
const statisticsModel = require('../../../domain/models/statistics');
const sistemLogsModel = require('../../../domain/models/systemLogs');
const sistemSettingsModel = require('../../../domain/models/systemSettings');
const transportMetadataModel = require('../../../domain/models/transportMetadata');

module.exports = {
  pageModel,
  concertModel,
  activityLogModel,
  cacheModel,
  cinemaModel,
  clienteModel,
  concertsModel,
  eventAnalyticsModel,
  eventSettingsModel,
  movieMetadataModel,
  notificationModel,
  promotionsModel,
  reviewsModel,  
  roomConfigModel,
  statisticsModel,
  sistemLogsModel,
  sistemSettingsModel,
  transportMetadataModel  
};  