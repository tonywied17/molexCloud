const fs = require('fs');
const { promisify } = require('util');
const fsPromises = {
  ...fs,
  writeFile: promisify(fs.writeFile),
  mkdir: promisify(fs.mkdir),
  rmdir: promisify(fs.rmdir),
  unlink: promisify(fs.unlink)
};
const path = require('path');
const { File, User } = require('../models');
const { pipeline } = require('stream/promises');
const { authenticateToken } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

//! Get all files
async function getAllFiles(req, res) {
    let privateFiles = [];
    let publicFiles = [];
    let userFiles = [];

    let privateFileTypeCounts = {};
    let userFileTypeCounts = {};

    // ? Public Files
    try {
      publicFiles = await File.findAll({
        where: { isPrivate: false }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
    const publicFileTypeCounts = publicFiles.reduce((counts, file) => {
      counts[file.fileType] = (counts[file.fileType] || 0) + 1;
      return counts;
    }, {});

    // ? Authenticated Request - Include private public files
    if (req.headers.authorization) {
      authenticateToken(req, res, async () => {
        try {
          privateFiles = await File.findAll({
            where: {
              isPrivate: true,
              UserId: req.user.userId.toString()
            }
          });
          let publicAndPrivateFiles = [...publicFiles, ...privateFiles];
          privateFileTypeCounts = privateFiles.reduce((counts, file) => {
            counts[file.fileType] = (counts[file.fileType] || 0) + 1;
            return counts;
          }, {});

          userFiles = publicAndPrivateFiles.filter(file => file.UserId === req.user.userId);
          userFileTypeCounts = userFiles.reduce((counts, file) => {
            counts[file.fileType] = (counts[file.fileType] || 0) + 1;
            return counts;
          }, {});

          res.json({ publicFiles, privateFiles, userFiles, publicFileTypeCounts, privateFileTypeCounts, userFileTypeCounts });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal server error' });
        }
      });
    } else {
      res.json({ publicFiles, publicFileTypeCounts });
    }

}

//! Upload file chunk via HTTP
async function uploadFileChunkHTTP(req, res) {
  try {
    const isPrivate = req.headers.isprivate === 'true';
    const totalChunks = parseInt(req.headers.totalchunks);
    const chunkNumber = parseInt(req.headers.chunknumber);
    const fileName = req.files.chunk.name;
    let chunk = req.files.chunk;

    const sessionId = req.body.sessionId;

    const userId = req.user.userId.toString();
    const author = req.user.username;

    const tempDirectory = path.join(__dirname, `../../uploads/temp/${sessionId}`);
    await fsPromises.mkdir(tempDirectory, { recursive: true });

    const filePath = path.join(tempDirectory, `${chunkNumber}.chunk`);
    await chunk.mv(filePath);

    console.log('Chunk ' + chunkNumber + '/' + totalChunks + ' uploaded successfully:', fileName);

    if (chunkNumber === totalChunks) {
      console.log('All chunks uploaded successfully');

      const finalDirectoryPath = path.join(__dirname, `../../uploads/${sessionId}`);
      await fsPromises.mkdir(finalDirectoryPath, { recursive: true });

      const finalFilePath = path.join(finalDirectoryPath, fileName);
      const finalFileStream = fs.createWriteStream(finalFilePath, { flags: 'a' })

      try {
        for (let i = 1; i <= totalChunks; i++) {
          const chunkPath = path.join(tempDirectory, `${i}.chunk`);
          console.log('Processing chunk:', chunkPath);
          const readStream = fs.createReadStream(chunkPath);
          await pipeline(readStream, finalFileStream, { end: false });
          console.log('Chunk processed:', chunkPath);
        }

        finalFileStream.end();

        fsPromises.rm(tempDirectory, { recursive: true }, (err) => {
          if (err) {
            console.error('Error removing temporary directory:', err);
          } else {
            console.log('Temporary directory removed successfully');
          }
        });
        
        console.log(`File ${fileName} assembled successfully`);

        // ? Insert or update file record in database
        const { fileTypeFromFile } = await import('file-type');
        const type = await fileTypeFromFile(finalFilePath)
        const fileTypeString = type ? (type.mime || type.ext || 'unknown') : 'unknown';

        console.log('Creating file record...');
        await File.create({
          filename: fileName,
          path: finalFilePath,
          isPrivate: isPrivate,
          fileType: fileTypeString,
          fileSize: fs.statSync(finalFilePath).size,
          author: author,
          downloads: 0,
          UserId: userId,
        });

        // ? Send 201 if last chunk
        res.sendStatus(201);

      } catch (error) {
        console.error('Error during file assembly:', error);
        res.status(500).send('Internal server error');
      }
    } else {

      // ? Send 200 for chunk upload if not the last chunk
      res.sendStatus(200);

    }

  } catch (error) {
    console.error('Error uploading chunk:', error);
    res.status(500).send('Internal server error');
  }
}

//! Download a file
async function downloadFile(req, res) {
  try {
    const fileId = req.params.id;
    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = file.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    const filesAuthorUser = await User.findByPk(file.UserId);
    if (!filesAuthorUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    filesAuthorUser.totalDownloads += 1;

    file.downloads += 1;
    await file.save();

    const contentType = file.fileType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Filename', file.filename);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Delete a file
async function deleteFile(req, res) {
  try {

    const fileId = req.params.id;
    const file = await File.findByPk(fileId);

    if (!file) {
      return res.status(404).json({ error: '[ERROR] File not found' });
    }
    const filePath = file.path;
    await file.destroy();
    
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: '[WARNING] File not found on server? Removing database record..' });
    }

    if (req.user.userId !== file.UserId) {
      return res.status(400).json({ error: '[ERROR] Not your file to delete!' });
    }
    
    await fsPromises.unlink(filePath);
    await file.destroy();

    res.json({ message: '[SUCCESS] File deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function randomString() {
  return Math.random().toString(36).substring(2, 7);
}

function uniqueFilename(filename) {
  return `${filename}-${uuidv4()}`;
}

module.exports = {
  uploadFileChunkHTTP,
  getAllFiles,
  downloadFile,
  deleteFile
};
