const express = require('express');
const router = express.Router();
const {
    crearAcuerdo, actualizarAcuerdo, eliminarAcuerdo, obtenerAcuerdos,
    obtenerDashboard, obtenerHistorial,
    obtenerOficios, subirOficio, eliminarOficio, verOficioPdf
} = require('../controllers/acuerdosController');
const { verificarJWT } = require('../middleware/auth');
const { validarAcuerdo, validarActualizarAcuerdo } = require('../middleware/validaciones');
const multer = require('multer');
const path = require('path');

// Storage para oficios
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/oficios/'),
    filename: (req, file, cb) => {
        const nombre = `oficio-${req.params.numero_acuerdo}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, nombre);
    }
});
const uploadOficio = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Solo se permiten archivos PDF.'));
    }
});

router.use(verificarJWT);

router.get('/dashboard', obtenerDashboard);
router.get('/', obtenerAcuerdos);
router.post('/', validarAcuerdo, crearAcuerdo);
router.put('/:numero_acuerdo', validarActualizarAcuerdo, actualizarAcuerdo);
router.get('/:numero_acuerdo/historial', obtenerHistorial);
router.delete('/:numero_acuerdo', eliminarAcuerdo);

// Rutas de oficios
router.get('/:numero_acuerdo/oficios', obtenerOficios);
router.post('/:numero_acuerdo/oficios', uploadOficio.single('archivo_pdf'), subirOficio);
router.delete('/:numero_acuerdo/oficios/:id_oficio', eliminarOficio);
router.get('/:numero_acuerdo/oficios/:id_oficio/pdf', verOficioPdf);

module.exports = router;
