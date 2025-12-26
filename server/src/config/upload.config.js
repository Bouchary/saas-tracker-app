// server/src/config/upload.config.js
// Configuration Multer pour upload fichiers CSV/Excel

const multer = require('multer');
const path = require('path');

// ✅ Stockage dans dossier uploads/ temporaire
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Format: timestamp-userId-originalname
    const userId = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '-'); // Enlever espaces
    cb(null, `${timestamp}-${userId}-${originalName}`);
  }
});

// ✅ Filtrage des types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non supporté. Formats acceptés : ${allowedExtensions.join(', ')}`), false);
  }
};

// ✅ Configuration multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max
  }
});

module.exports = upload;