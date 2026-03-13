const multer = require('multer');
const path = require('path');
require('dotenv').config();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOADS_PATH);
    },
    // El archivo se guarda con el mismo nombre que el numero_acta 
    filename: (req, file, cb) => {
        const numeroActa = req.body.numero_acta;
        cb(null, `${numeroActa}.pdf`);
    }
});

// Solo permite archivos PDF 
const filtroArchivo = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos en formato PDF.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter: filtroArchivo,
    limits: { fileSize: 80 * 1024 * 1024 } // máximo 80MB por archivo
});

module.exports = upload;
