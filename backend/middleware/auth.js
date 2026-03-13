const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware: verifica que el request tenga un JWT válido
const verificarJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Acepta token del header O del query string (para abrir PDFs en pestaña nueva)
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado. Token requerido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; // { id_usuario, nombre, rol }
        next();
    } catch (error) {
        return res.status(403).json({ mensaje: 'Token inválido o expirado.' });
    }
};

// Middleware: verifica que el usuario sea Administrador
const soloAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'Administrador') {
        return res.status(403).json({ mensaje: 'Acceso restringido a administradores.' });
    }
    next();
};

module.exports = { verificarJWT, soloAdmin };
