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
const File = require('../models/File');
const { pipeline } = require('stream/promises');
const { authenticateToken } = require('../middleware/authMiddleware');
const Sequelize = require('sequelize');

//! Get all files excluding private files
async function getAllFiles(req, res) {
  try {
    const publicFiles = await File.findAll({ where: { isPrivate: false } });

    const publicFileTypesCounts = await File.findAll({
      attributes: ['fileType', [Sequelize.fn('COUNT', Sequelize.col('fileType')), 'count']],
      where: { isPrivate: false },
      group: ['fileType']
    });

    let fileTypeCountsObject = {};
    publicFileTypesCounts.forEach(file => {
      fileTypeCountsObject[file.fileType] = file.get('count');
    });

    res.json({ files: publicFiles, fileTypeCounts: fileTypeCountsObject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Get all private files
async function getPrivateFiles(req, res) {
  try {
    const privateFiles = await File.findAll({ where: { isPrivate: true } });

    const privateFileTypesCounts = await File.findAll({
      attributes: ['fileType', [Sequelize.fn('COUNT', Sequelize.col('fileType')), 'count']],
      where: { isPrivate: true },
      group: ['fileType']
    });

    let fileTypeCountsObject = {};
    privateFileTypesCounts.forEach(file => {
      fileTypeCountsObject[file.fileType] = file.get('count');
    });

    res.json({ files: privateFiles, fileTypeCounts: fileTypeCountsObject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Get unique file types and their counts
async function getFileTypesCounts(req, res) {
  try {
    let fileTypeCountsObject = {};

    if (req.headers.authorization) {
      authenticateToken(req, res, async () => {
        try {
          const fileTypesCounts = await File.findAll({
            attributes: ['fileType', [Sequelize.fn('COUNT', Sequelize.col('fileType')), 'count']],
            group: ['fileType']
          });

          fileTypesCounts.forEach(file => {
            fileTypeCountsObject[file.fileType] = file.get('count');
          });

          res.json(fileTypeCountsObject);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal server error' });
        }
      });
    } else {
      const publicFileTypesCounts = await File.findAll({
        attributes: ['fileType', [Sequelize.fn('COUNT', Sequelize.col('fileType')), 'count']],
        where: { isPrivate: false },
        group: ['fileType']
      });

      publicFileTypesCounts.forEach(file => {
        fileTypeCountsObject[file.fileType] = file.get('count');
      });

      res.json(fileTypeCountsObject);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Upload file chunk via HTTP
async function uploadFileChunkHTTP(req, res) {
  try {
    const isPrivate = req.headers.isprivate === 'true';
    const totalChunks = parseInt(req.headers.totalchunks);
    const chunkNumber = parseInt(req.headers.chunknumber);
    // const userId = req.user.userId.toString();
    const userId = randomString();

    let chunk = req.files.chunk;
    const fileName = chunk.name;

    const fileNameWithoutExtension = fileName.split('.').slice(0, -1).join('.');

    const tempDirectory = path.join(__dirname, '../../uploads/temp');
    await fsPromises.mkdir(tempDirectory, { recursive: true });
    const tempChunkDirectory = path.join(tempDirectory, `${userId}-${fileNameWithoutExtension}`);

    await fsPromises.mkdir(tempChunkDirectory, { recursive: true });

    const filePath = path.join(tempChunkDirectory, `${chunkNumber}.chunk`);

    await chunk.mv(filePath);

    console.log('Chunk ' + chunkNumber + '/' + totalChunks + ' uploaded successfully:', fileName);

    if (chunkNumber === totalChunks) {
      console.log('All chunks uploaded successfully');

      const finalDirectoryPath = path.join(__dirname, `../../uploads/${userId}`);
      await fsPromises.mkdir(finalDirectoryPath, { recursive: true });
      const finalFilePath = path.join(finalDirectoryPath, fileName);

      const finalFileStream = fs.createWriteStream(finalFilePath, { flags: 'a' });


      try {
        for (let i = 1; i <= totalChunks; i++) {
          const chunkPath = path.join(tempChunkDirectory, `${i}.chunk`);
          console.log('Processing chunk:', chunkPath);
          const readStream = fs.createReadStream(chunkPath);
          await pipeline(readStream, finalFileStream, { end: false });
          console.log('Chunk processed:', chunkPath);
        }

        finalFileStream.end();

        await fsPromises.rmdir(tempChunkDirectory, { recursive: true });

        console.log(`File ${fileName} assembled successfully`);

        const { fileTypeFromFile } = await import('file-type');
        const type = await fileTypeFromFile(finalFilePath)
        const fileTypeString = type ? (type.mime || type.ext || 'unknown') : 'unknown';

        const existingFile = await File.findOne({ where: { filename: fileName } });
        if (existingFile) {
          console.log('File already exists. Updating record...');
          await existingFile.update({
            filename: fileName,
            path: finalFilePath,
            isPrivate: isPrivate,
            fileType: fileTypeString
          });
        } else {
          console.log('Creating file record...');
          await File.create({
            filename: fileName,
            path: finalFilePath,
            isPrivate: isPrivate,
            fileType: fileTypeString
          });
        }

        res.sendStatus(201);
      } catch (error) {
        console.error('Error during file assembly:', error);
        res.status(500).send('Internal server error');
      }
    } else {
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

    const contentType = file.fileType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Filename', file.filename);

    if (file.isPrivate) {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Token missing' });
      }
      try {
        await authenticateToken(req, res, async () => {
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
        });
      } catch (error) {
        console.error('Token authentication failed:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }
    } else {
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to generate random string
function randomString() {
  return Math.random().toString(36).substring(2, 7);
}

module.exports = {
  uploadFileChunkHTTP,
  getAllFiles,
  getPrivateFiles,
  getFileTypesCounts,
  downloadFile
};
