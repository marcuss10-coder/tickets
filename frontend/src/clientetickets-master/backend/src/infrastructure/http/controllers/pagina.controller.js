const paginaCtl = {}
const orm = require('../../../infrastructure/database/connection/dataBase.orm')
const sql = require('../../../infrastructure/database/connection/dataBase.sql')
const mongo = require('../../../infrastructure/database/connection/dataBaseMongose')
const { cifrarDatos, descifrarDatos } = require('../../../application/encrypDates')

function safeDecrypt(data) {
    try {
        return descifrarDatos(data);
    } catch (error) {
        console.error('Error al descifrar datos:', error.message);
        return ''; // Devolver una cadena vacía si ocurre un error
    }
}

paginaCtl.mostrarPagina = async (req, res) => {
    const [listaPagina] = await sql.promise().query('SELECT * FROM 	pages')
    const pagina = await mongo.pageModel.findOne({ where: { idPageSql: listaPagina[0].idPage } })
    const paginas = listaPagina[0]
    const data = {
        paginas,
        pagina
    }
    return data
}

paginaCtl.mandarPagina = async (req, res) => {
    const id = req.user.idUser
    try {
        const {namePage, description, statePage, visionPage, misionPage, celularPage, correoPagina} = req.body
        const envioSQL = {
            namePage,
            description,
            statePage,
            createPage: new Date().toLocaleString(),
        }
        const envioPage = await orm.pagina.create(envioSQL)
        const idPagina = envioPage.insertId

        const envioMongo = {
            visionPage,
            misionPage,
            celularPage,
            correoPagina,
            idPageSql: idPagina,
            createPageMongo: new Date().toLocaleString(),
        }

        await mongo.pageModel.create(envioMongo)
        res.flash('success','Exito al guardar')
        return ('exito al guardar')

    } catch (error) {
        res.json('error al envio', error);
        return error
    }
}

module.exports = paginaCtl