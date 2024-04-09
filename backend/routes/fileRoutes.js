const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

// UnProtected route for fetching files
router.get('/', fileController.getAllFiles);

// Protected route for uploading files
router.post('/upload/chunk', authenticateToken, fileController.uploadFileChunk);

// Protected route for fetching private files
router.get('/private', authenticateToken, fileController.getPrivateFiles);

module.exports = router;
