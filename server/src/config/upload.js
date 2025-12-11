// server/src/config/upload.js
// Configuration pour l'upload de fichiers avec Multer

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Générer un nom unique avec hash + timestamp
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const filename = `${timestamp}-${uniqueSuffix}${ext}`;
        cb(null, filename);
    }
});

// Filtrer les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé : ${file.mimetype}. Formats acceptés : PDF, JPG, PNG, DOC, DOCX`), false);
    }
};

// Limites de taille (10 MB)
const limits = {
    fileSize: 10 * 1024 * 1024 // 10 MB
};

// Configuration de Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: limits
});

module.exports = upload;