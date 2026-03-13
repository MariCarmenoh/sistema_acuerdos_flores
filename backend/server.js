const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Rutas
const authRoutes     = require('./routes/auth');
const actasRoutes    = require('./routes/actas');
const acuerdosRoutes = require('./routes/acuerdos');
const usuariosRoutes = require('./routes/usuarios');

// Cron job de vencimientos
const { iniciarCronVencidos } = require('./config/cron');

const app = express();

// =============================================
// MIDDLEWARES GLOBALES
// =============================================

// Helmet: headers de seguridad HTTP (previene XSS, clickjacking, etc.)
app.use(helmet());

// CORS: solo permite requests desde el frontend
app.use(cors({ origin: 'http://localhost:5173' }));

// Rate limiting general — amplio para uso normal de oficina
const limiterGeneral = rateLimit({
    windowMs: 60 * 60 * 1000, // ventana de 1 hora
    max: 5000,                 // 5000 requests por IP por hora
    message: { mensaje: 'Demasiadas solicitudes. Intente de nuevo en unos minutos.' }
});

// Rate limiting para login — solo para prevenir fuerza bruta
const limiterLogin = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20,                   // 20 intentos por IP
    message: { mensaje: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.' }
});

app.use('/api/', limiterGeneral);
app.use('/api/auth/login', limiterLogin);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// RUTAS
// =============================================
app.use('/api/auth',     authRoutes);

// Ruta global de historial — GET /api/historial
const { verificarJWT } = require('./middleware/auth');
const pool = require('./config/db');
app.get('/api/historial', verificarJWT, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT h.id_historial, h.tabla_afectada, h.registro_id, h.accion,
                    h.detalle, h.fecha,
                    CONCAT(u.nombre, ' ', u.apellidos) AS usuario
             FROM historial_cambios h
             LEFT JOIN usuarios u ON h.usuario_id = u.id_usuario
             ORDER BY h.fecha DESC
             LIMIT 500`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial global:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
});
app.use('/api/actas',    actasRoutes);
app.use('/api/acuerdos', acuerdosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Ruta de salud — para verificar que el servidor está corriendo
app.get('/api/health', (req, res) => {
    res.json({ estado: 'ok', timestamp: new Date().toISOString() });
});

// Ruta manual para forzar actualización de vencidos (útil para pruebas)
// GET /api/admin/actualizar-vencidos
const { actualizarVencidos } = require('./config/cron');
app.get('/api/admin/actualizar-vencidos', verificarJWT, async (req, res) => {
    const n = await actualizarVencidos();
    res.json({ mensaje: `Se actualizaron ${n} acuerdos a Vencido.` });
});

// =============================================
// MANEJO DE ERRORES GLOBALES
// =============================================
app.use((err, req, res, next) => {
    // Error de Multer (archivo no válido, muy grande, etc.)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ mensaje: 'El archivo supera el tamaño máximo permitido (20MB).' });
    }
    if (err.message === 'Solo se permiten archivos en formato PDF.') {
        return res.status(400).json({ mensaje: err.message });
    }
    console.error('Error no controlado:', err);
    return res.status(500).json({ mensaje: 'Error interno del servidor.' });
});

// =============================================
// INICIO
// =============================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    iniciarCronVencidos();
});
