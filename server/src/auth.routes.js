// server/src/auth.routes.js

const express = require('express');
const router = express.Router();
const { register, login } = require('./auth.controller');
const { validate } = require('./middlewares/validation');
const { registerValidation, loginValidation } = require('./validators/authValidator');

// POST /api/auth/register - Inscription avec validation
router.post('/register', validate(registerValidation), register);

// POST /api/auth/login - Connexion avec validation
router.post('/login', validate(loginValidation), login);

module.exports = router;