const { body, param, validationResult } = require('express-validator');

// Middleware para retornar errores de validación con mensajes claros
const validar = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        const mensajes = errores.array().map(e => e.msg);
        return res.status(400).json({ mensaje: mensajes[0], errores: mensajes });
    }
    next();
};

// Reglas de validación para login
const validarLogin = [
    body('correo').isEmail().withMessage('El correo electrónico no es válido.'),
    body('password').notEmpty().withMessage('La contraseña es requerida.'),
    validar
];

// Reglas de validación para crear acuerdo
const validarAcuerdo = [
    body('numero_acuerdo').notEmpty().withMessage('El número de acuerdo es requerido.'),
    body('asunto').notEmpty().withMessage('El asunto del acuerdo es requerido.'),
    body('fecha_acuerdo').isDate().withMessage('La fecha del acuerdo no es válida.'),
    body('numero_acta').notEmpty().withMessage('Debe seleccionar un número de acta.'),
    body('plazo_dias').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }).withMessage('El plazo debe ser un número igual o mayor a 0.'),
    validar
];

// Reglas de validación para actualizar acuerdo
const validarActualizarAcuerdo = [
    body('estado').optional().isIn(['Pendiente', 'Cumplido', 'Vencido'])
        .withMessage('El estado debe ser Pendiente, Cumplido o Vencido.'),
    body('fecha_acuerdo').optional().isDate().withMessage('La fecha del acuerdo no es válida.'),
    body('plazo_dias').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }).withMessage('El plazo debe ser un número igual o mayor a 0.'),
    // Nota: la validación de fecha_respuesta cuando estado=Cumplido
    // se maneja en el frontend para crear, no al editar.
    validar
];

// Reglas de validación para crear acta
const validarActa = [
    body('numero_acta').notEmpty().withMessage('El número de acta es requerido.'),
    body('tipo_sesion').isIn(['Ordinaria', 'Extraordinaria'])
        .withMessage('El tipo de sesión debe ser Ordinaria o Extraordinaria.'),
    body('fecha_sesion').isDate().withMessage('La fecha de sesión no es válida.'),
    validar
];

// Reglas de validación para crear usuario
const validarUsuario = [
    body('nombre').notEmpty().withMessage('El nombre es requerido.'),
    body('apellidos').notEmpty().withMessage('Los apellidos son requeridos.'),
    body('correo').isEmail().withMessage('El correo electrónico no es válido.'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    body('rol').isIn(['Administrador', 'Usuario']).withMessage('El rol debe ser Administrador o Usuario.'),
    validar
];

module.exports = {
    validarLogin, validarAcuerdo, validarActualizarAcuerdo,
    validarActa, validarUsuario
};
