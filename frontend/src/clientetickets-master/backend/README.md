# Sistema de Tickets - Backend

Esta es una aplicación backend en Node.js para un sistema de ticketing con soporte dual de bases de datos (MySQL y MongoDB).

## Estructura del Proyecto (Arquitectura Hexagonal)

Hemos reestructurado el proyecto siguiendo los principios de arquitectura hexagonal:

```
src/
├── application/
│   └── use-cases/
├── domain/
│   ├── models/
│   └── services/
├── infrastructure/
│   ├── http/
│   │   ├── controllers/
│   │   └── router/
│   ├── database/
│   │   ├── connection/
│   │   └── sql/
│   ├── logs/
│   └── lib/
├── config/

root/
├── app.js
└── index.js
```

## Cambios Realizados

### 1. Reestructuración de Arquitectura
- Movimos archivos a capas apropiadas siguiendo la arquitectura hexagonal
- Controladores movidos a `src/infrastructure/http/controllers/`
- Modelos SQL movidos a `src/infrastructure/database/sql/`
- Modelos MongoDB movidos a `src/domain/models/`
- Conexiones de base de datos movidas a `src/infrastructure/database/connection/`
- Archivos de configuración mantenidos en `src/config/`

### 2. Correcciones de Rutas
- Corregimos todas las rutas de importación para coincidir con la nueva estructura de directorios
- Actualizamos archivos de conexión de base de datos para referenciar correctamente los archivos de configuración
- Corregimos archivos de rutas para apuntar a las ubicaciones correctas de los controladores

### 3. Configuración de Base de Datos
- Actualizamos la configuración de MySQL para trabajar con la instalación local de XAMPP
- Host cambiado de IP remota a `localhost`
- Nombre de usuario establecido a `root` (usuario predeterminado de MySQL en XAMPP)
- Contraseña dejada vacía (contraseña predeterminada de MySQL en XAMPP)
- Nombre de base de datos: `tickets`

## Instrucciones de Configuración

### Requisitos Previos
1. Instalar [XAMPP](https://www.apachefriends.org/index.html)
2. Instalar [Node.js](https://nodejs.org/)

### Configuración de Base de Datos
1. Iniciar el Panel de Control de XAMPP
2. Iniciar los servicios Apache y MySQL
3. Abrir phpMyAdmin (normalmente en http://localhost/phpmyadmin)
4. Crear una nueva base de datos llamada `tickets`

### Pasos de Instalación
1. Clonar o descargar este repositorio
2. Navegar al directorio del proyecto
3. Instalar dependencias:
   ```bash
   npm install
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Ejecutando la Aplicación

### Modo de Desarrollo
```bash
npm run dev
```
Esto inicia el servidor con recarga automática usando nodemon.

### Modo de Producción
```bash
npm start
```
Esto ejecuta el servidor en modo de producción.

El servidor se iniciará en el puerto 5000 por defecto. Puedes acceder a él en http://localhost:5000

## Conexiones de Base de Datos

### MySQL (mediante Sequelize y mysql2)
- Utilizado para datos relacionales como usuarios, roles, tickets, reservaciones
- Conexión gestionada a través de `src/infrastructure/database/connection/dataBase.orm.js` y `dataBase.sql.js`

### MongoDB (mediante Mongoose)
- Utilizado para datos basados en documentos como registros, análisis, metadatos
- Conexión gestionada a través de `src/infrastructure/database/connection/dataBaseMongose.js`

## Características Principales

- Autenticación y autorización de usuarios
- Control de acceso basado en roles
- Gestión de tickets para eventos, conciertos, cine y transporte
- Sistema de reservaciones
- Gestión de productos
- Procesamiento de transacciones
- Gestión de personal
- Servicios basados en ubicación (ciudades, países)

## Características de Seguridad

- Encriptación de contraseñas con bcrypt
- Gestión de sesiones con express-session
- Protección CSRF con csurf
- Limitación de tasas para prevenir abusos
- Helmet.js para seguridad de encabezados HTTP
- Validación y sanitización de entradas
- Prevención de inyección SQL a través de ORM Sequelize

## Endpoints de la API

La API está organizada por recursos:
- `/auth` - Rutas de autenticación
- `/users` - Gestión de usuarios
- `/roles` - Gestión de roles
- `/tickets` - Gestión de tickets
- `/reservations` - Sistema de reservaciones
- `/products` - Gestión de productos
- `/transactions` - Procesamiento de transacciones
- `/cinema` - Características específicas de cine
- `/concert` - Características específicas de conciertos
- `/transport` - Servicios de transporte
- `/staff` - Gestión de personal

## Solución de Problemas

### Tablas No Se Crean
Si las tablas de la base de datos no se están creando:
1. Asegúrate de que MySQL esté funcionando en XAMPP
2. Verifica que exista la base de datos `tickets`
3. Comprueba que las credenciales de la base de datos en `src/config/keys.js` sean correctas
4. Revisa los registros del servidor en busca de errores de conexión a la base de datos

### Problemas de Conexión
Si tienes problemas para conectarte a las bases de datos:
1. Verifica que MySQL de XAMPP esté funcionando en el puerto 3306
2. Comprueba que la cadena de conexión de MongoDB Atlas sea válida (si usas MongoDB remoto)
3. Asegúrate de que el firewall no esté bloqueando las conexiones

## Dependencias

Las principales dependencias incluyen:
- Express.js - Framework web
- Sequelize - ORM para MySQL
- Mongoose - ODM para MongoDB
- Passport - Autenticación
- Bcrypt - Hash de contraseñas
- Helmet - Encabezados de seguridad
- Winston - Registro
- Varias bibliotecas de utilidades

Para una lista completa, consulta `package.json`.

## Desarrollo

Este proyecto utiliza nodemon para desarrollo, que reinicia automáticamente el servidor cuando se detectan cambios en el código.

Para reiniciar manualmente el servidor mientras está en modo nodemon, escribe `rs` en la terminal.