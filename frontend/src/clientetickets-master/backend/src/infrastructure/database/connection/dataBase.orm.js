const { Sequelize } = require("sequelize");
const { MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT, MYSQL_URI } = require("../../../config/keys");

let sequelize;

// Usar URI de conexión si está disponible
if (MYSQL_URI) {
    sequelize = new Sequelize(MYSQL_URI, {
        dialect: 'mysql',
        dialectOptions: {
            charset: 'utf8mb4', // Soporte para caracteres especiales
        },
        pool: {
            max: 20, // Número máximo de conexiones
            min: 5,  // Número mínimo de conexiones
            acquire: 30000, // Tiempo máximo en ms para obtener una conexión
            idle: 10000 // Tiempo máximo en ms que una conexión puede estar inactiva
        },
        logging: false // Desactiva el logging para mejorar el rendimiento
    });
} else {
    // Configuración para parámetros individuales
    sequelize = new Sequelize(MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD, {
        host: MYSQLHOST,
        port: MYSQLPORT,
        dialect: 'mysql',
        dialectOptions: {
            charset: 'utf8mb4', // Soporte para caracteres especiales
        },
        pool: {
            max: 20, // Número máximo de conexiones
            min: 5,  // Número mínimo de conexiones
            acquire: 30000, // Tiempo máximo en ms para obtener una conexión
            idle: 10000 // Tiempo máximo en ms que una conexión puede estar inactiva
        },
        logging: false // Desactiva el logging para mejorar el rendimiento
    });
}

// Autenticar y sincronizar
sequelize.authenticate()
    .then(() => {
        console.log("Conexión establecida con la base de datos");
    })
    .catch((err) => {
        console.error("No se pudo conectar a la base de datos:", err.message);
    });

// Sincronización de la base de datos
const syncOptions = process.env.NODE_ENV === 'development' ? { force: true } : { alter: true };

sequelize.sync(syncOptions)
    .then(() => {
        console.log('Base de Datos sincronizadas');
    })
    .catch((error) => {
        console.error('Error al sincronizar la Base de Datos:', error);
    });

//extracionModelos
const usuarioModel = require('../sql/usuario')
const rolModel = require('../sql/rol')
const detalleRolModel = require('../sql/detalleRol')
const pageModel = require('../sql/page')
const countryModel = require('../sql/countries');
const cityModel = require('../sql/city');
const cinemaModel = require('../sql/cinemas');
const movieModel = require('../sql/movies');
const genreModel = require('../sql/genres');
const classificationModel = require('../sql/classifications');
const roomModel = require('../sql/rooms');
const seatModel = require('../sql/seats');
const funcModel = require('../sql/functions');
const reservationModel = require('../sql/reservations');
const reservedSeatModel = require('../sql/reservedSeats');
const productCategoryModel = require('../sql/productCategories');
const productModel = require('../sql/products');
const transactionModel = require('../sql/transactions');
const eventModel = require('../sql/event');
const ticketModel = require('../sql/tickets');
const artistModel = require('../sql/artists');
const concertVenueModel = require('../sql/concertVenues');
const concertModel = require('../sql/concerts');
const concertSectionModel = require('../sql/concertSections');
const concertSeatModel = require('../sql/concertSeats');
const concertReservationModel = require('../sql/concertReservations');
const transportCompanyModel = require('../sql/transportCompanies');
const transportRouteModel = require('../sql/transportRoutes');
const transportVehicleModel = require('../sql/transportVehicles');
const transportScheduleModel = require('../sql/transportSchedules');
const transportSeatModel = require('../sql/transportSeats');
const transportReservationModel = require('../sql/transportReservations');
const staffModel = require('../sql/staff');
const staffAssignmentModel = require('../sql/staffAssignments');
const clienteModel = require('../sql/cliente');



//intaciar los modelos a sincronizar
const usuario = usuarioModel(sequelize, Sequelize)
const rol = rolModel(sequelize, Sequelize)
const detalleRol = detalleRolModel(sequelize, Sequelize)
const page = pageModel(sequelize, Sequelize)
const Country = countryModel(sequelize, Sequelize);
const City = cityModel(sequelize, Sequelize);
const Cinema = cinemaModel(sequelize, Sequelize);
const Movie = movieModel(sequelize, Sequelize);
const Genre = genreModel(sequelize, Sequelize);
const Classification = classificationModel(sequelize, Sequelize);
const Room = roomModel(sequelize, Sequelize);
const Seat = seatModel(sequelize, Sequelize);
const Function = funcModel(sequelize, Sequelize);
const Reservation = reservationModel(sequelize, Sequelize);
const ReservedSeat = reservedSeatModel(sequelize, Sequelize);
const ProductCategory = productCategoryModel(sequelize, Sequelize);
const Product = productModel(sequelize, Sequelize);
const Transaction = transactionModel(sequelize, Sequelize);
const Event = eventModel(sequelize, Sequelize);
const Ticket = ticketModel(sequelize, Sequelize);
const Artist = artistModel(sequelize, Sequelize);
const ConcertVenue = concertVenueModel(sequelize, Sequelize);
const Concert = concertModel(sequelize, Sequelize);
const ConcertSection = concertSectionModel(sequelize, Sequelize);
const ConcertSeat = concertSeatModel(sequelize, Sequelize);
const ConcertReservation = concertReservationModel(sequelize, Sequelize);
const TransportCompany = transportCompanyModel(sequelize, Sequelize);
const TransportRoute = transportRouteModel(sequelize, Sequelize);
const TransportVehicle = transportVehicleModel(sequelize, Sequelize);
const TransportSchedule = transportScheduleModel(sequelize, Sequelize);
const TransportSeat = transportSeatModel(sequelize, Sequelize);
const TransportReservation = transportReservationModel(sequelize, Sequelize);
const Staff = staffModel(sequelize, Sequelize);
const StaffAssignment = staffAssignmentModel(sequelize, Sequelize);
const cliente = clienteModel(sequelize, Sequelize);


//relaciones o foreingKeys

usuario.hasMany(detalleRol)
detalleRol.belongsTo(usuario)

rol.hasMany(detalleRol)
detalleRol.belongsTo(rol)

usuario.hasMany(page)
page.belongsTo(usuario)

// === RELACIONES DE EVENTOS CENTRALES ===
usuario.hasMany(Event, { foreignKey: 'createdBy' });
Event.belongsTo(usuario, { foreignKey: 'createdBy' });

Event.hasMany(Ticket, { foreignKey: 'eventId' });
Ticket.belongsTo(Event, { foreignKey: 'eventId' });

usuario.hasMany(Ticket, { foreignKey: 'usuarioId' });
Ticket.belongsTo(usuario, { foreignKey: 'usuarioId' });

// === RELACIONES DE CINEMA ===
Cinema.hasMany(Room, { foreignKey: 'cinemaId' });
Room.belongsTo(Cinema, { foreignKey: 'cinemaId' });

Room.hasMany(Seat, { foreignKey: 'roomId' });
Seat.belongsTo(Room, { foreignKey: 'roomId' });

Movie.hasMany(Function, { foreignKey: 'movieId' });
Function.belongsTo(Movie, { foreignKey: 'movieId' });

Room.hasMany(Function, { foreignKey: 'roomId' });
Function.belongsTo(Room, { foreignKey: 'roomId' });

// === RELACIONES DE CONCIERTOS ===
Artist.hasMany(Concert, { foreignKey: 'artistId' });
Concert.belongsTo(Artist, { foreignKey: 'artistId' });

ConcertVenue.hasMany(Concert, { foreignKey: 'venueId' });
Concert.belongsTo(ConcertVenue, { foreignKey: 'venueId' });

ConcertVenue.hasMany(ConcertSection, { foreignKey: 'venueId' });
ConcertSection.belongsTo(ConcertVenue, { foreignKey: 'venueId' });

ConcertSection.hasMany(ConcertSeat, { foreignKey: 'sectionId' });
ConcertSeat.belongsTo(ConcertSection, { foreignKey: 'sectionId' });

Concert.hasMany(ConcertReservation, { foreignKey: 'concertId' });
ConcertReservation.belongsTo(Concert, { foreignKey: 'concertId' });

usuario.hasMany(ConcertReservation, { foreignKey: 'usuarioId' });
ConcertReservation.belongsTo(usuario, { foreignKey: 'usuarioId' });

ConcertSeat.hasMany(ConcertReservation, { foreignKey: 'seatId' });
ConcertReservation.belongsTo(ConcertSeat, { foreignKey: 'seatId' });

// === RELACIONES DE TRANSPORTE ===
TransportCompany.hasMany(TransportRoute, { foreignKey: 'companyId' });
TransportRoute.belongsTo(TransportCompany, { foreignKey: 'companyId' });

TransportCompany.hasMany(TransportVehicle, { foreignKey: 'companyId' });
TransportVehicle.belongsTo(TransportCompany, { foreignKey: 'companyId' });

TransportRoute.hasMany(TransportVehicle, { foreignKey: 'routeId' });
TransportVehicle.belongsTo(TransportRoute, { foreignKey: 'routeId' });

TransportRoute.hasMany(TransportSchedule, { foreignKey: 'routeId' });
TransportSchedule.belongsTo(TransportRoute, { foreignKey: 'routeId' });

TransportVehicle.hasMany(TransportSchedule, { foreignKey: 'vehicleId' });
TransportSchedule.belongsTo(TransportVehicle, { foreignKey: 'vehicleId' });

TransportVehicle.hasMany(TransportSeat, { foreignKey: 'vehicleId' });
TransportSeat.belongsTo(TransportVehicle, { foreignKey: 'vehicleId' });

TransportSchedule.hasMany(TransportReservation, { foreignKey: 'scheduleId' });
TransportReservation.belongsTo(TransportSchedule, { foreignKey: 'scheduleId' });

TransportSeat.hasMany(TransportReservation, { foreignKey: 'seatId' });
TransportReservation.belongsTo(TransportSeat, { foreignKey: 'seatId' });

usuario.hasMany(TransportReservation, { foreignKey: 'usuarioId' });
TransportReservation.belongsTo(usuario, { foreignKey: 'usuarioId' });

// === RELACIONES DE STAFF ===
usuario.hasMany(Staff, { foreignKey: 'usuarioId' });
Staff.belongsTo(usuario, { foreignKey: 'usuarioId' });

Staff.hasMany(StaffAssignment, { foreignKey: 'staffId' });
StaffAssignment.belongsTo(Staff, { foreignKey: 'staffId' });

// Asignaciones específicas por tipo de evento
Cinema.hasMany(StaffAssignment, { foreignKey: 'locationId' });
StaffAssignment.belongsTo(Cinema, { foreignKey: 'locationId' });

ConcertVenue.hasMany(StaffAssignment, { foreignKey: 'locationId' });
StaffAssignment.belongsTo(ConcertVenue, { foreignKey: 'locationId' });

TransportCompany.hasMany(StaffAssignment, { foreignKey: 'locationId' });
StaffAssignment.belongsTo(TransportCompany, { foreignKey: 'locationId' });

// === RELACIONES DE PRODUCTOS ===
ProductCategory.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(ProductCategory, { foreignKey: 'categoryId' });

// === RELACIONES DE RESERVAS Y TRANSACCIONES ===
usuario.hasMany(Reservation, { foreignKey: 'usuarioId' });
Reservation.belongsTo(usuario, { foreignKey: 'usuarioId' });

Reservation.hasMany(Transaction, { foreignKey: 'reservationId' });
Transaction.belongsTo(Reservation, { foreignKey: 'reservationId' });

usuario.hasMany(Transaction, { foreignKey: 'usuarioId' });
Transaction.belongsTo(usuario, { foreignKey: 'usuarioId' });

// Exportar el objeto sequelize
module.exports = {
    usuario,
    rol,
    detalleRol,
    page,
    Country,
    City,
    Cinema,
    Movie,
    Genre,
    Classification,
    Room,
    Seat,
    Function,
    Reservation,
    ReservedSeat,
    ProductCategory,
    Product,
    Transaction,
    Event,
    Ticket,
    Artist,
    ConcertVenue,
    Concert,
    ConcertSection,
    ConcertSeat,
    ConcertReservation,
    TransportCompany,
    TransportRoute,
    TransportVehicle,
    TransportSchedule,
    TransportSeat,
    TransportReservation,
    Staff,
    StaffAssignment,
    cliente,
};
