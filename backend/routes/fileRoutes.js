const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateBearerToken } = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

//! UnProtected route for fetching files
router.get('/', fileController.getAllFiles);

//! Protected route for uploading files via HTTP
router.post('/upload/chunk', authenticateToken, fileController.uploadFileChunkHTTP);

//! Create file record only for ftp upload
router.post('/record', authenticateBearerToken, fileController.createFileRecord);

//! Route to download a file
router.get('/:id', fileController.downloadFile);

//! Route to delete a file
router.delete('/:id', authenticateToken, fileController.deleteFile);

module.exports = router;
