const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else {
        console.log('Usuario no autenticado, redirigiendo a inicio de sesión');
        req.session.returnTo = req.originalUrl;
        return res.redirect('/');
    }
};

module.exports = isLoggedIn;