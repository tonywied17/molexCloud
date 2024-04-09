const multer = require('multer');
const FileType = require('file-type');
const fs = require('fs').promises;
const path = require('path');
const File = require('../models/File');
const jwt = require('jsonwebtoken');

//! Uploading Configuration
const uploadDirectory = path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    const userUploadDirectory = path.join(uploadDirectory, userId);
    fs.mkdir(userUploadDirectory, { recursive: true }).then(() => {
      cb(null, userUploadDirectory);
    }).catch(err => {
      cb(err);
    });
  },
  filename: (req, file, cb) => {
    const uniqueFileName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueFileName);
  }
});

const upload = multer({ storage: storage }).single('file');

//! Get all files excluding private files
async function getAllFiles(req, res) {
  try {
    const files = await File.findAll({ where: { isPrivate: false } });
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Get all private files
async function getPrivateFiles(req, res) {
  try {
    const files = await File.findAll({ where: { isPrivate: true } });
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Upload file chunk
async function uploadFileChunk(req, res) {
  try {
    upload(req, res, async function(err) {
      if (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
      }

      const { filename, chunkNumber, totalChunks } = req.body;
      const chunkPath = path.join(uploadDirectory, req.user.id.toString(), `${filename}.part${chunkNumber}`);

      await fs.writeFile(chunkPath, req.body.chunk, { flag: 'wx' });

      if (chunkNumber === totalChunks) {
        const filePath = path.join(uploadDirectory, req.user.id.toString(), filename);
        const writeStream = fs.createWriteStream(filePath, { flags: 'a' });

        for (let i = 1; i <= totalChunks; i++) {
          const chunkPath = path.join(uploadDirectory, req.user.id.toString(), `${filename}.part${i}`);
          const chunkData = await fs.readFile(chunkPath);
          writeStream.write(chunkData);
          await fs.unlink(chunkPath);
        }

        writeStream.end();

        const fileType = await FileType.fromFile(filePath);
        const mimeType = fileType ? fileType.mime : null;

        await File.create({
          filename: filename,
          path: filePath,
          isPrivate: req.body.isPrivate || false,
          fileType: mimeType || null
        });

        res.sendStatus(200);
      } else {
        res.sendStatus(200);
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
}

module.exports = {
  getAllFiles,
  getPrivateFiles,
  uploadFileChunk
};
