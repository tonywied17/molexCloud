const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');
const multer = require('multer');

// UnProtected route for fetching files
router.get('/', fileController.getAllFiles);

// Protected route for uploading files
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      console.log('Received file route storage:', file.originalname);
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  limits: { fileSize: Infinity }, 
});

// Upload file route for HTTP requests
router.post('/upload/chunk', authenticateToken, upload.single('chunk'), fileController.uploadFileChunkHTTP);

// Protected route for fetching private files
router.get('/private', authenticateToken, fileController.getPrivateFiles);

module.exports = router;
