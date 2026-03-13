const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// POST /api/auth/login  
const login = async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ mensaje: 'Correo y contraseña son requeridos.' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE correo = ? AND activo = TRUE',
            [correo]
        );

        if (rows.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
        }

        const usuario = rows[0];
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
        }

        // Actualizar último acceso
        await pool.query(
            'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?',
            [usuario.id_usuario]
        );

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                nombre:     usuario.nombre,
                apellidos:  usuario.apellidos,
                rol:        usuario.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // mensaje de bienvenida personalizado
        return res.json({
            mensaje:  `Bienvenido/a, ${usuario.nombre} ${usuario.apellidos}.`,
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre:     usuario.nombre,
                apellidos:  usuario.apellidos,
                correo:     usuario.correo,
                rol:        usuario.rol,
                puesto:     usuario.puesto
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

module.exports = { login };
