const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { cifrarDatos, descifrarDatos } = require('../application/encrypDates');

//archvios de coneccion
const orm = require('../infrastructure/database/connection/dataBase.orm');
const sql = require('../infrastructure/database/connection/dataBase.sql');
const mongo = require('../infrastructure/database/connection/dataBaseMongose')

const descifrarSeguro = (dato) => {
    try {
        return dato ? descifrarDatos(dato) : '';
    } catch (error) {
        console.error('Error al descifrar:', error);
        return '';
    }
};


const guardarYSubirArchivo = async (archivo, filePath, columnName, idEstudent, url, req) => {
    const validaciones = {
        imagen: [".PNG", ".JPG", ".JPEG", ".GIF", ".TIF", ".png", ".jpg", ".jpeg", ".gif", ".tif", ".ico", ".ICO", ".webp", ".WEBP"],
        pdf: [".pdf", ".PDF"]
    };
    const tipoArchivo = columnName === 'photoEstudent' ? 'imagen' : 'pdf';
    const validacion = path.extname(archivo.name);

    if (!validaciones[tipoArchivo].includes(validacion)) {
        throw new Error('Archivo no compatible.');
    }

    return new Promise((resolve, reject) => {
        archivo.mv(filePath, async (err) => {
            if (err) {
                return reject(new Error('Error al guardar el archivo.'));
            } else {
                try {
                    await sql.promise().query(`UPDATE students SET ${columnName} = ? WHERE idEstudent = ?`, [archivo.name, idEstudent]);

                    const formData = new FormData();
                    formData.append('image', fs.createReadStream(filePath), {
                        filename: archivo.name,
                        contentType: archivo.mimetype,
                    });

                    const response = await axios.post(url, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'X-CSRF-Token': req.csrfToken(),
                            'Cookie': req.headers.cookie
                        },
                    });

                    if (response.status !== 200) {
                        throw new Error('Error al subir archivo al servidor externo.');
                    }

                    resolve();
                } catch (uploadError) {
                    console.error('Error al subir archivo al servidor externo:', uploadError.message);
                    reject(new Error('Error al subir archivo al servidor externo.'));
                }
            }
        });
    });
};

// Función para buscar usuario por username o email (datos cifrados)
const buscarUsuarioPorCredenciales = async (identifier) => {
    try {
        // Obtener todos los usuarios activos
        const [users] = await sql.promise().query(
            'SELECT * FROM users WHERE stateUser = "active"'
        );

        // Buscar el usuario comparando datos descifrados
        for (const user of users) {
            try {
                const userNameDescifrado = descifrarSeguro(user.userName);
                const emailDescifrado = descifrarSeguro(user.emailUser);
                
                if (userNameDescifrado === identifier || emailDescifrado === identifier) {
                    return user;
                }
            } catch (error) {
                console.log('Error al descifrar usuario:', user.idUser);
                continue; // Continuar con el siguiente usuario
            }
        }
        return null;
    } catch (error) {
        console.error('Error en búsqueda de usuario:', error);
        return null;
    }
};

// Estrategia para registro de usuarios
passport.use(
    'local.Signup',
    new LocalStrategy(
        {
            usernameField: 'userName',
            passwordField: 'passwordUser',
            passReqToCallback: true,
        },
        async (req, userName, passwordUser, done) => {
            try {
                const { nameUsers, phoneUser, emailUser } = req.body;

                // Verificar si el usuario ya existe
                const existingUser = await buscarUsuarioPorCredenciales(userName);
                const existingEmail = await buscarUsuarioPorCredenciales(emailUser);

                if (existingUser) {
                    return done(null, false, { message: 'El nombre de usuario ya existe' });
                }

                if (existingEmail) {
                    return done(null, false, { message: 'El email ya está registrado' });
                }

                // Encriptar contraseña con bcrypt
                const hashedPassword = await bcrypt.hash(passwordUser, 10);

                // Crear nuevo usuario con datos cifrados
                const newUser = await orm.usuario.create({
                    nameUsers: cifrarDatos(nameUsers),
                    phoneUser: cifrarDatos(phoneUser || ''),
                    emailUser: cifrarDatos(emailUser),
                    userName: cifrarDatos(userName),
                    passwordUser: hashedPassword, // Usar bcrypt para la contraseña
                    stateUser: 'active',
                    createUser: new Date().toLocaleString()
                });

                // Preparar objeto de usuario para la sesión
                const userForSession = {
                    idUser: newUser.idUser,
                    nameUsers: nameUsers, // Datos sin cifrar para la sesión
                    emailUser: emailUser,
                    userName: userName,
                    stateUser: 'active'
                };

                return done(null, userForSession, { message: 'Usuario registrado exitosamente' });

            } catch (error) {
                console.error('Error en registro:', error);
                return done(error);
            }
        }
    )
);

// Estrategia para login de usuarios
passport.use(
    'local.Signin',
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true,
        },
        async (req, username, password, done) => {
            try {
                // Buscar usuario por username o email
                const user = await buscarUsuarioPorCredenciales(username);

                if (!user) {
                    return done(null, false, { message: "El usuario no existe" });
                }

                // Verificar contraseña
                const isValidPassword = await bcrypt.compare(password, user.passwordUser);

                if (!isValidPassword) {
                    return done(null, false, { message: "Contraseña incorrecta" });
                }

                // Preparar objeto de usuario para la sesión con datos descifrados
                const userForSession = {
                    idUser: user.idUser,
                    nameUsers: descifrarSeguro(user.nameUsers),
                    phoneUser: descifrarSeguro(user.phoneUser),
                    emailUser: descifrarSeguro(user.emailUser),
                    userName: descifrarSeguro(user.userName),
                    stateUser: user.stateUser,
                    createUser: user.createUser
                };

                return done(null, userForSession, { message: `Bienvenido ${userForSession.nameUsers}` });

            } catch (error) {
                console.error('Error en login:', error);
                return done(error);
            }
        }
    )
);

// Serialización del usuario para la sesión
passport.serializeUser((user, done) => {
    // Solo guardar el ID en la sesión
    done(null, user.idUser);
});

// Deserialización del usuario desde la sesión
passport.deserializeUser(async (idUser, done) => {
    try {
        const [users] = await sql.promise().query(
            'SELECT * FROM users WHERE idUser = ? AND stateUser = "active"',
            [idUser]
        );

        if (users.length === 0) {
            return done(null, false);
        }

        const user = users[0];

        // Preparar objeto de usuario con datos descifrados
        const userForSession = {
            idUser: user.idUser,
            nameUsers: descifrarSeguro(user.nameUsers),
            phoneUser: descifrarSeguro(user.phoneUser),
            emailUser: descifrarSeguro(user.emailUser),
            userName: descifrarSeguro(user.userName),
            stateUser: user.stateUser,
            createUser: user.createUser
        };

        done(null, userForSession);
    } catch (error) {
        console.error('Error en deserialización:', error);
        done(error);
    }
});

passport.use(
    'local.teacherSignin',
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true,
        },
        async (req, username, password, done) => {
            const [users] = await sql.promise().query('SELECT * FROM teachers WHERE usernameTeahcer = ?', [username]);
            const usuario = users[0]
            if (usuario.usernameTeahcer == username) {
                if (password == usuario.passwordTeacher) {
                    return done(null, usuario, req.flash("success", "Bienvenido" + " " + usuario.username));
                } else {
                    return done(null, false, req.flash("message", "Datos incorrecta"));
                }
            }
            return done(null, false, req.flash("message", "El nombre de usuario no existe."));
        }
    )
);

passport.use(
    'local.studentSignin',
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true,
        },
        async (req, username, password, done) => {
            const [users] = await sql.promise().query('SELECT * FROM students WHERE usernameEstudent = ?', [username]);
            const usuario = users[0]
            if (usuario.usernameEstudent == username) {
                if (password == usuario.passwordEstudent) {
                    return done(null, usuario, req.flash("success", "Bienvenido" + " " + usuario.username));
                } else {
                    return done(null, false, req.flash("message", "Datos incorrecta"));
                }
            }
            return done(null, false, req.flash("message", "El nombre de usuario no existe."));
        }
    )
);

passport.use(
    'local.studentSignup',
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true,
        },
        async (req, username, password, done) => {
            try {
                const existingUser = await orm.student.findOne({ where: { usernameEstudent: cifrarDatos(username) } });
                if (existingUser) {
                    return done(null, false, req.flash('message', 'La cedula del usuario ya existe.'));
                } else {
                    const {
                        idEstudent,
                        completeNameEstudent,
                        emailEstudent,
                        celularEstudent,
                        ubicacion,
                    } = req.body;

                    let newClient = {
                        idEstudent: idEstudent,
                        identificationCardTeacher: cifrarDatos(username),
                        celularEstudent: cifrarDatos(celularEstudent),
                        emailEstudent: cifrarDatos(emailEstudent),
                        completeNameEstudent: cifrarDatos(completeNameEstudent),
                        usernameEstudent: username,
                        passwordEstudent: password,
                        ubicationStudent: ubicacion,
                        rolStudent: 'student',
                        stateEstudent: 'Activar',
                        createStudent: new Date().toLocaleString()
                    };

                    const guardar = await orm.student.create(newClient);

                    if (req.files) {
                        const { photoEstudent } = req.files;

                        // Guardar y subir foto del profesor
                        if (photoEstudent) {
                            const photoFilePath = path.join(__dirname, '/../public/img/usuario/', photoEstudent.name);
                            await guardarYSubirArchivo(photoEstudent, photoFilePath, 'photoEstudent', idEstudent, 'https://www.central.profego-edu.com/imagenEstudiante', req);
                        }
                    }

                    newClient.id = guardar.insertId
                    return done(null, newClient);
                }
            } catch (error) {
                return done(error);
            }
        }
    )
);

passport.use(
    'local.teacherSignup',
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true,
        },
        async (req, username, password, done) => {
            try {
                const existingUser = await orm.teacher.findOne({ where: { identificationCardTeacher: username } });
                if (existingUser) {
                    return done(null, false, req.flash('message', 'La cedula del usuario ya existe.'));
                } else {
                    const {
                        idTeacher,
                        completeNmeTeacher,
                        emailTeacher,
                        phoneTeacher
                    } = req.body;

                    let newClient = {
                        idTeacher: idTeacher,
                        identificationCardTeacher: cifrarDatos(username),
                        phoneTeacher: cifrarDatos(phoneTeacher),
                        emailTeacher: cifrarDatos(emailTeacher),
                        completeNmeTeacher: cifrarDatos(completeNmeTeacher),
                        usernameTeahcer: username,
                        passwordTeacher: password,
                        rolTeacher: 'teacher',
                        stateTeacher: 'pendiente',
                        createTeahcer: new Date().toLocaleString()
                    };
                    const guardar = await orm.teacher.create(newClient);
                    newClient.id = guardar.insertId
                    return done(null, newClient);
                }
            } catch (error) {
                return done(error);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;