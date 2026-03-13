const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { validarLogin } = require('../middleware/validaciones');

// POST /api/auth/login
router.post('/login', validarLogin, login);

module.exports = router;
