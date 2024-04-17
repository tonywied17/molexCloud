const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');
const multer = require('multer');

//! UnProtected route for fetching files
router.get('/', fileController.getAllFiles);

//! Protected route for fetching private files
router.get('/private', authenticateToken, fileController.getPrivateFiles);

//! User's files
router.get('/user', authenticateToken, fileController.getFilesByAuthor);

//! Add route to get unique file types and their counts
router.get('/filetypes', fileController.getFileTypesCounts);

//? Multer configuration for file upload via HTTP
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
//! Protected route for uploading files via HTTP
router.post('/upload/chunk', authenticateToken, upload.single('chunk'), fileController.uploadFileChunkHTTP);

//! Route to download a file
router.get('/download/:id', fileController.downloadFile);

module.exports = router;
