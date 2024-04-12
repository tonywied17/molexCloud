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
    filename: function (req, file, cb) {
      console.log('Received file route storage:', file.originalname);
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  extended: true
});

router.post('/upload/chunk', authenticateToken, upload.single('chunk'), fileController.uploadFileChunk);

// Protected route for fetching private files
router.get('/private', authenticateToken, fileController.getPrivateFiles);

module.exports = router;
