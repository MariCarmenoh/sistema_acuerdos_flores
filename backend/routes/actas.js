const express = require('express');
const router = express.Router();
const { crearActa, obtenerActas, verPdf, editarActa, eliminarActa } = require('../controllers/actasController');
const { verificarJWT } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validarActa } = require('../middleware/validaciones');

router.use(verificarJWT);

router.get('/', obtenerActas);
router.post('/', upload.single('archivo_pdf'), validarActa, crearActa);
router.get('/:numero_acta/pdf', verPdf);
router.put('/:numero_acta', editarActa);
router.delete('/:numero_acta', eliminarActa);

module.exports = router;
