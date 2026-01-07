const express = require("express");
const router = express.Router();

const { mostrarPagina, mandarPagina } = require('../../http/controllers/pagina.controller')

router.get('/lista', mostrarPagina)
router.post('/crear', mandarPagina)

module.exports = router
