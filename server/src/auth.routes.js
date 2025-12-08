// server/src/auth.routes.js

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

// Route POST /api/auth/register
router.post('/register', authController.register);

// Route POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;