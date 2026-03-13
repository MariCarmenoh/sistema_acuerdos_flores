const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/usuarios  — solo Administrador
const obtenerUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id_usuario, nombre, apellidos, correo, rol, puesto, activo, fecha_creacion, ultimo_acceso FROM usuarios ORDER BY nombre'
        );
        return res.json(rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// POST /api/usuarios  — crear usuario, solo Administrador
const crearUsuario = async (req, res) => {
    const { nombre, apellidos, correo, password, rol, puesto } = req.body;

    if (!nombre || !apellidos || !correo || !password || !rol) {
        return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben completarse.' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);

        await pool.query(
            'INSERT INTO usuarios (nombre, apellidos, correo, password_hash, rol, puesto) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellidos, correo, passwordHash, rol, puesto || null]
        );

        return res.status(201).json({ mensaje: 'Usuario creado correctamente.' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo.' });
        }
        console.error('Error al crear usuario:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// PUT /api/usuarios/:id/estado  — activar/desactivar usuario, solo Administrador
const cambiarEstadoUsuario = async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;

    try {
        await pool.query(
            'UPDATE usuarios SET activo = ? WHERE id_usuario = ?',
            [activo, id]
        );
        return res.json({ mensaje: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente.` });
    } catch (error) {
        console.error('Error al cambiar estado de usuario:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};


// PUT /api/usuarios/:id  — editar usuario, solo Administrador
const editarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellidos, correo, puesto, rol, password } = req.body;
    try {
        if (password) {
            const hash = await require('bcryptjs').hash(password, 12);
            await pool.query(
                'UPDATE usuarios SET nombre=COALESCE(?,nombre), apellidos=COALESCE(?,apellidos), correo=COALESCE(?,correo), puesto=?, rol=COALESCE(?,rol), password_hash=? WHERE id_usuario=?',
                [nombre||null, apellidos||null, correo||null, puesto||null, rol||null, hash, id]
            );
        } else {
            await pool.query(
                'UPDATE usuarios SET nombre=COALESCE(?,nombre), apellidos=COALESCE(?,apellidos), correo=COALESCE(?,correo), puesto=?, rol=COALESCE(?,rol) WHERE id_usuario=?',
                [nombre||null, apellidos||null, correo||null, puesto||null, rol||null, id]
            );
        }
        return res.json({ mensaje: 'Usuario actualizado correctamente.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo.' });
        }
        console.error('Error al editar usuario:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

module.exports = { obtenerUsuarios, crearUsuario, cambiarEstadoUsuario, editarUsuario };
