const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');

// ✅ Ajouter organizationMiddleware si authMiddleware ne définit pas req.organizationId
router.get('/', authMiddleware, organizationMiddleware, globalSearch);

module.exports = router;