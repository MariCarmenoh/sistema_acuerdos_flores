const cron = require('node-cron');
const pool = require('../config/db');

const actualizarVencidos = async () => {
    const conn = await pool.getConnection();
    try {
        await conn.query('SET @usuario_activo = NULL');
        const [result] = await conn.query(
            `UPDATE acuerdos
             SET estado = 'Vencido'
             WHERE estado = 'Pendiente'
               AND fecha_vencimiento IS NOT NULL
               AND fecha_vencimiento < CURDATE()`
        );
        if (result.affectedRows > 0) {
            console.log(`[CRON] ${new Date().toISOString()} — Acuerdos marcados como Vencido: ${result.affectedRows}`);
        }
        return result.affectedRows;
    } catch (error) {
        console.error('[CRON] Error al actualizar vencidos:', error);
        return 0;
    } finally {
        conn.release();
    }
};

const iniciarCronVencidos = () => {
    // Corre todos los días a medianoche, zona horaria Costa Rica (UTC-6)
    cron.schedule('0 0 * * *', actualizarVencidos, {
        timezone: 'America/Costa_Rica'
    });

    // También corre al iniciar el servidor para corregir cualquier vencimiento pendiente
    actualizarVencidos().then(n => {
        if (n > 0) console.log('[INICIO] Se actualizaron ' + n + ' acuerdos vencidos al arrancar.');
    });

    console.log('[CRON] Tarea de vencimientos iniciada — corre diariamente a medianoche (America/Costa_Rica).');
};

// Exportamos también la función para usarla manualmente desde una ruta si se necesita
module.exports = { iniciarCronVencidos, actualizarVencidos };
