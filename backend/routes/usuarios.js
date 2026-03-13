const express = require('express');
const router = express.Router();
const { obtenerUsuarios, crearUsuario, cambiarEstadoUsuario, editarUsuario } = require('../controllers/usuariosController');
const { verificarJWT, soloAdmin } = require('../middleware/auth');
const { validarUsuario } = require('../middleware/validaciones');

// Todas las rutas requieren JWT y rol Administrador
router.use(verificarJWT, soloAdmin);

// GET  /api/usuarios
router.get('/', obtenerUsuarios);

// POST /api/usuarios
router.post('/', validarUsuario, crearUsuario);

// PUT  /api/usuarios/:id/estado
router.put('/:id', editarUsuario);
router.put('/:id/estado', cambiarEstadoUsuario);

module.exports = router;
