const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const crearActa = async (req, res) => {
    const { numero_acta, tipo_sesion, fecha_sesion } = req.body;
    const idUsuario = req.usuario.id_usuario;

    if (!numero_acta || !tipo_sesion || !fecha_sesion) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ mensaje: 'numero_acta, tipo_sesion y fecha_sesion son obligatorios.' });
    }
    if (!req.file) {
        return res.status(400).json({ mensaje: 'El archivo PDF del acta es obligatorio.' });
    }

    const rutaPdf = `${process.env.UPLOADS_PATH}/${numero_acta}.pdf`;
    try {
        // Verificar si existe un acta eliminada con el mismo número — si es así la restauramos
        const [existente] = await pool.query(
            'SELECT numero_acta, eliminado FROM actas WHERE numero_acta = ?', [numero_acta]
        );
        if (existente.length > 0 && existente[0].eliminado) {
            // Restaurar acta eliminada con los nuevos datos
            await pool.query(
                `UPDATE actas SET tipo_sesion=?, fecha_sesion=?, ruta_pdf=?,
                 usuario_registro=?, fecha_registro=NOW(),
                 eliminado=FALSE, fecha_eliminacion=NULL, eliminado_por=NULL
                 WHERE numero_acta=?`,
                [tipo_sesion, fecha_sesion, rutaPdf, idUsuario, numero_acta]
            );
        } else if (existente.length > 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(409).json({ mensaje: 'Ya existe un acta activa con ese número.' });
        } else {
            await pool.query(
                'INSERT INTO actas (numero_acta, tipo_sesion, fecha_sesion, ruta_pdf, usuario_registro) VALUES (?, ?, ?, ?, ?)',
                [numero_acta, tipo_sesion, fecha_sesion, rutaPdf, idUsuario]
            );
        }
        return res.status(201).json({ mensaje: 'Acta registrada correctamente.', numero_acta });
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('Error al crear acta:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

const obtenerActas = async (req, res) => {
    const { buscar, tipo_sesion, fecha } = req.query;
    let query = `
        SELECT a.numero_acta, a.tipo_sesion, a.fecha_sesion, a.fecha_registro,
               CONCAT(u.nombre, ' ', u.apellidos) AS registrado_por
        FROM actas a
        JOIN usuarios u ON a.usuario_registro = u.id_usuario
        WHERE a.eliminado = FALSE
    `;
    const params = [];
    if (buscar) { query += ' AND a.numero_acta LIKE ?'; params.push(`%${buscar}%`); }
    if (tipo_sesion) { query += ' AND a.tipo_sesion = ?'; params.push(tipo_sesion); }
    if (fecha) { query += ' AND a.fecha_sesion = ?'; params.push(fecha); }
    query += ' ORDER BY a.fecha_sesion DESC';
    try {
        const [rows] = await pool.query(query, params);
        return res.json(rows);
    } catch (error) {
        console.error('Error al obtener actas:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

const verPdf = async (req, res) => {
    const { numero_acta } = req.params;
    try {
        const [rows] = await pool.query('SELECT ruta_pdf FROM actas WHERE numero_acta = ?', [numero_acta]);
        if (rows.length === 0) return res.status(404).json({ mensaje: 'Acta no encontrada.' });
        const rutaAbsoluta = path.resolve(rows[0].ruta_pdf);
        if (!fs.existsSync(rutaAbsoluta)) return res.status(404).json({ mensaje: 'Archivo PDF no encontrado.' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${numero_acta}.pdf"`);
        return res.sendFile(rutaAbsoluta);
    } catch (error) {
        console.error('Error al servir PDF:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// PUT /api/actas/:numero_acta — editar tipo_sesion y fecha_sesion
const editarActa = async (req, res) => {
    const { numero_acta } = req.params;
    const { tipo_sesion, fecha_sesion } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE actas SET tipo_sesion = COALESCE(?, tipo_sesion), fecha_sesion = COALESCE(?, fecha_sesion) WHERE numero_acta = ?',
            [tipo_sesion || null, fecha_sesion || null, numero_acta]
        );
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Acta no encontrada.' });
        return res.json({ mensaje: 'Acta actualizada correctamente.' });
    } catch (error) {
        console.error('Error al editar acta:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// DELETE /api/actas/:numero_acta — soft delete
const eliminarActa = async (req, res) => {
    const { numero_acta } = req.params;
    const idUsuario = req.usuario.id_usuario;
    try {
        // Verificar si tiene acuerdos activos asociados
        const [acuerdos] = await pool.query(
            'SELECT COUNT(*) AS total FROM acuerdos WHERE numero_acta = ? AND eliminado = FALSE',
            [numero_acta]
        );
        if (acuerdos[0].total > 0) {
            return res.status(409).json({
                mensaje: `No se puede eliminar el acta porque tiene ${acuerdos[0].total} acuerdo(s) activo(s) asociado(s). Elimine primero los acuerdos.`
            });
        }
        const [result] = await pool.query(
            `UPDATE actas
             SET eliminado = TRUE,
                 fecha_eliminacion = NOW(),
                 eliminado_por = ?
             WHERE numero_acta = ? AND eliminado = FALSE`,
            [idUsuario, numero_acta]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Acta no encontrada o ya eliminada.' });
        }
        return res.json({ mensaje: 'Acta eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar acta:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

module.exports = { crearActa, obtenerActas, verPdf, editarActa, eliminarActa };
