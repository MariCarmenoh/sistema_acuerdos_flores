const pool = require('../config/db');

const setUsuarioActivo = async (conn, idUsuario) => {
    await conn.query('SET @usuario_activo = ?', [idUsuario]);
};

// POST /api/acuerdos
const crearAcuerdo = async (req, res) => {
    const { numero_acuerdo, asunto, fecha_acuerdo, plazo_dias, fecha_respuesta, estado, numero_acta } = req.body;

    if (!numero_acuerdo || !asunto || !fecha_acuerdo || !numero_acta) {
        return res.status(400).json({ mensaje: 'numero_acuerdo, asunto, fecha_acuerdo y numero_acta son obligatorios.' });
    }

    const conn = await pool.getConnection();
    try {
        await setUsuarioActivo(conn, req.usuario.id_usuario);

        // Verificar si existe un acuerdo eliminado con el mismo número — restaurar si es así
        const [existente] = await conn.query(
            'SELECT numero_acuerdo, eliminado FROM acuerdos WHERE numero_acuerdo = ?', [numero_acuerdo]
        );
        if (existente.length > 0 && existente[0].eliminado) {
            await conn.query(
                `UPDATE acuerdos SET asunto=?, fecha_acuerdo=?, estado=?, plazo_dias=?,
                 fecha_respuesta=?, numero_acta=?, usuario_registro=?, fecha_registro=NOW(),
                 eliminado=FALSE, fecha_eliminacion=NULL, eliminado_por=NULL,
                 usuario_modificacion=NULL, fecha_modificacion=NULL
                 WHERE numero_acuerdo=?`,
                [asunto, fecha_acuerdo, estado || 'Pendiente', plazo_dias || null,
                 fecha_respuesta || null, numero_acta, req.usuario.id_usuario, numero_acuerdo]
            );
        } else if (existente.length > 0) {
            return res.status(409).json({ mensaje: `El número de acuerdo "${numero_acuerdo}" ya existe.` });
        } else {
            await conn.query(
                `INSERT INTO acuerdos
                    (numero_acuerdo, asunto, fecha_acuerdo, estado, plazo_dias, fecha_respuesta, numero_acta, usuario_registro)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [numero_acuerdo, asunto, fecha_acuerdo, estado || 'Pendiente',
                 plazo_dias || null, fecha_respuesta || null, numero_acta, req.usuario.id_usuario]
            );
        }

        return res.status(201).json({ mensaje: 'Acuerdo registrado correctamente.', numero_acuerdo });

    } catch (error) {
        console.error('Error al crear acuerdo:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
};

// PUT /api/acuerdos/:numero_acuerdo
const actualizarAcuerdo = async (req, res) => {
    const { numero_acuerdo } = req.params;
    const { asunto, fecha_acuerdo, estado, plazo_dias, fecha_respuesta } = req.body;

    const conn = await pool.getConnection();
    try {
        await setUsuarioActivo(conn, req.usuario.id_usuario);

        const [result] = await conn.query(
            `UPDATE acuerdos SET
                asunto               = COALESCE(?, asunto),
                fecha_acuerdo        = COALESCE(?, fecha_acuerdo),
                estado               = COALESCE(?, estado),
                plazo_dias           = ?,
                fecha_respuesta      = ?,
                usuario_modificacion = ?
             WHERE numero_acuerdo = ?`,
            [
                asunto, fecha_acuerdo, estado,
                plazo_dias || null,
                fecha_respuesta || null,
                req.usuario.id_usuario, numero_acuerdo
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Acuerdo no encontrado.' });
        }

        return res.json({ mensaje: 'Acuerdo actualizado correctamente.' });

    } catch (error) {
        console.error('Error al actualizar acuerdo:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
};

// GET /api/acuerdos
const obtenerAcuerdos = async (req, res) => {
    const { busqueda, numero_acuerdo, numero_acta, asunto, estado, fecha } = req.query;

    let query = 'SELECT * FROM vista_acuerdos_semaforo WHERE 1=1';
    const params = [];

    if (busqueda) {
        query += ' AND (numero_acuerdo LIKE ? OR numero_acta LIKE ? OR asunto LIKE ?)';
        const term = `%${busqueda}%`;
        params.push(term, term, term);
    }
    if (numero_acuerdo) {
        query += ' AND numero_acuerdo LIKE ?';
        params.push(`%${numero_acuerdo}%`);
    }
    if (numero_acta) {
        query += ' AND numero_acta LIKE ?';
        params.push(`%${numero_acta}%`);
    }
    if (asunto) {
        query += ' AND asunto LIKE ?';
        params.push(`%${asunto}%`);
    }
    if (estado) {
        query += ' AND estado = ?';
        params.push(estado);
    }
    if (fecha) {
        query += ' AND fecha_acuerdo = ?';
        params.push(fecha);
    }

    query += ' ORDER BY fecha_acuerdo DESC';

    try {
        const [rows] = await pool.query(query, params);
        return res.json(rows);
    } catch (error) {
        console.error('Error al obtener acuerdos:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// GET /api/acuerdos/dashboard
const obtenerDashboard = async (req, res) => {
    try {
        const [totales] = await pool.query('SELECT * FROM vista_dashboard_estados');
        const [recientes] = await pool.query(
            'SELECT * FROM vista_acuerdos_semaforo ORDER BY fecha_acuerdo DESC LIMIT 5'
        );
        const resumen = { Pendiente: 0, Cumplido: 0, Vencido: 0 };
        totales.forEach(row => { resumen[row.estado] = row.total; });
        return res.json({ resumen, recientes });
    } catch (error) {
        console.error('Error al obtener dashboard:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// GET /api/acuerdos/:numero_acuerdo/historial
const obtenerHistorial = async (req, res) => {
    const { numero_acuerdo } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT h.accion, h.detalle, h.fecha,
                    CONCAT(u.nombre, ' ', u.apellidos) AS usuario
             FROM historial_cambios h
             LEFT JOIN usuarios u ON h.usuario_id = u.id_usuario
             WHERE (
                 (h.tabla_afectada = 'acuerdos' AND h.registro_id = ?)
                 OR
                 (h.tabla_afectada = 'oficios' AND h.registro_id LIKE ?)
             )
             ORDER BY h.fecha DESC`,
            [numero_acuerdo, `%${numero_acuerdo}%`]
        );
        return res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// GET /api/acuerdos/:numero_acuerdo/oficios
const obtenerOficios = async (req, res) => {
    const { numero_acuerdo } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT o.id_oficio, o.ruta_pdf, o.nombre_archivo, o.fecha_registro,
                    CONCAT(u.nombre, ' ', u.apellidos) AS registrado_por
             FROM oficios o
             LEFT JOIN usuarios u ON o.usuario_registro = u.id_usuario
             WHERE o.numero_acuerdo = ?
             ORDER BY o.fecha_registro DESC`,
            [numero_acuerdo]
        );
        return res.json(rows);
    } catch (error) {
        console.error('Error al obtener oficios:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// POST /api/acuerdos/:numero_acuerdo/oficios
const subirOficio = async (req, res) => {
    const { numero_acuerdo } = req.params;
    if (!req.file) {
        return res.status(400).json({ mensaje: 'Debe adjuntar un archivo PDF.' });
    }
    const conn = await pool.getConnection();
    try {
        await setUsuarioActivo(conn, req.usuario.id_usuario);
        const nombreArchivo = req.file.originalname;
        await conn.query(
            `INSERT INTO oficios (numero_acuerdo, ruta_pdf, nombre_archivo, usuario_registro) VALUES (?, ?, ?, ?)`,
            [numero_acuerdo, req.file.path, nombreArchivo, req.usuario.id_usuario]
        );
        return res.status(201).json({ mensaje: 'Oficio registrado correctamente.' });
    } catch (error) {
        console.error('Error al subir oficio:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
};

// DELETE /api/acuerdos/:numero_acuerdo/oficios/:id_oficio
const eliminarOficio = async (req, res) => {
    const { numero_acuerdo, id_oficio } = req.params;
    const fs = require('fs');
    const conn = await pool.getConnection();
    try {
        await setUsuarioActivo(conn, req.usuario.id_usuario);
        const [rows] = await conn.query(
            'SELECT ruta_pdf FROM oficios WHERE id_oficio = ? AND numero_acuerdo = ?',
            [id_oficio, numero_acuerdo]
        );
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Oficio no encontrado.' });
        }
        // Borrar archivo físico
        try { fs.unlinkSync(rows[0].ruta_pdf); } catch {}
        await conn.query('DELETE FROM oficios WHERE id_oficio = ?', [id_oficio]);
        return res.json({ mensaje: 'Oficio eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar oficio:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
};

// GET /api/acuerdos/:numero_acuerdo/oficios/:id_oficio/pdf
const verOficioPdf = async (req, res) => {
    const { numero_acuerdo, id_oficio } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT ruta_pdf FROM oficios WHERE id_oficio = ? AND numero_acuerdo = ?',
            [id_oficio, numero_acuerdo]
        );
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Oficio no encontrado.' });
        }
        return res.sendFile(require('path').resolve(rows[0].ruta_pdf));
    } catch (error) {
        console.error('Error al ver oficio:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};


// DELETE /api/acuerdos/:numero_acuerdo — soft delete (marca como eliminado, no borra)
const eliminarAcuerdo = async (req, res) => {
    const { numero_acuerdo } = req.params;
    const conn = await pool.getConnection();
    try {
        await setUsuarioActivo(conn, req.usuario.id_usuario);
        const [result] = await conn.query(
            `UPDATE acuerdos
             SET eliminado = TRUE,
                 fecha_eliminacion = NOW(),
                 eliminado_por = ?
             WHERE numero_acuerdo = ? AND eliminado = FALSE`,
            [req.usuario.id_usuario, numero_acuerdo]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Acuerdo no encontrado o ya eliminado.' });
        }
        return res.json({ mensaje: 'Acuerdo eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar acuerdo:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        conn.release();
    }
};

module.exports = {
    crearAcuerdo, actualizarAcuerdo, eliminarAcuerdo, obtenerAcuerdos, obtenerDashboard,
    obtenerHistorial, obtenerOficios, subirOficio, eliminarOficio, verOficioPdf
};
