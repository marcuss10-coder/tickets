const passport = require('passport')
const orm = require('../../../infrastructure/database/connection/dataBase.orm')
const sql = require('../../../infrastructure/database/connection/dataBase.sql')
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { descifrarDatos, cifrarDatos } = require('../../../application/encrypDates');
const { validationResult } = require('express-validator');
const indexCtl = {}

indexCtl.mostrarMensaje = async(req, res)=>{
     res.json('hola mundo');
}


indexCtl.registro = passport.authenticate("local.Signup", {
    successRedirect: "/closeSection",
    failureRedirect: "/registro",
    failureFlash: true,
    failureMessage: true
})

indexCtl.login = passport.authenticate("local.Signup", {
    successRedirect: "/ruta",
    failureRedirect: "/registro",
    failureFlash: true,
    failureMessage: true
})

indexCtl.CerrarSesion = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash("success", "Cerrada la Sesión con éxito.");
        res.redirect("/");
    });
};


module.exports = indexCtl