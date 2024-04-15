const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//! Register user route
router.post('/register', authController.register);

//! Login user route
router.post('/login', authController.login);

module.exports = router;
