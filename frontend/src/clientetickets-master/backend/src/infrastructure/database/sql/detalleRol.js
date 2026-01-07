const detalleRol = (sequelize, type)=>{
    return sequelize.define('detalleROls',{
        idDetalleRol:{
            type: type.INTEGER,
            autoIncremnt: true,
            primaryKey: true
        },
        createDetalleRol: type.STRING,
        updateDetalleRol: type.STRING,
    },{
        timestamps: false,
        Comment: 'Talbla de detalle Rol'
    })
}


module.exports = detalleRol