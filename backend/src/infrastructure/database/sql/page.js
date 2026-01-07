const page = (sequelize, type) =>{
    return sequelize.define('pages',{
        idPage: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        namePage: type.STRING,
        description: type.STRING,
        statePage: type.STRING,
        createPage: type.STRING,
        updatePage: type.STRING,
    },{
        timestamps: false,
        Comment: 'Tabla de Pagina'
    })
}

module.exports = page