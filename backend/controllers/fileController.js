const fs = require('fs');
const { promisify } = require('util');
const fsPromises = {
  ...fs,
  writeFile: promisify(fs.writeFile),
  mkdir: promisify(fs.mkdir),
  rmdir: promisify(fs.rmdir),
  unlink: promisify(fs.unlink)
};
const Sequelize = require('sequelize');
const path = require('path');
const File = require('../models/File');
const { pipeline } = require('stream/promises');
const { authenticateToken } = require('../middleware/authMiddleware');


//! Get all public files
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

    // ? Get file type counts
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

//! Get Files where user is author
async function getFilesByAuthor(req, res) {
  try {
    const userId = req.user.userId.toString();
    const userFiles = await File.findAll({ where: { userId: userId } });
    res.json(userFiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Get unique file types and their counts
async function getFileTypesCounts(req, res) {
  try {
    let fileTypeCountsObject = {};

    // ? Authenticated Request - Include private and public files
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

    // ? Public Request - Exclude private files
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
    const userId = req.user.userId.toString();
    const fileName = chunk.name;
    let chunk = req.files.chunk;

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

        // ? Insert or update file record in database
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
            fileType: fileTypeString,
            fileSize: fs.statSync(finalFilePath).size,
            userId: userId,
          });
        } else {
          console.log('Creating file record...');
          await File.create({
            filename: fileName,
            path: finalFilePath,
            isPrivate: isPrivate,
            fileType: fileTypeString,
            fileSize: fs.statSync(finalFilePath).size,
            userId: userId,
          });
        }

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

    const contentType = file.fileType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Filename', file.filename);

    // ? Private file - Authenticate token
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
    // ? Public file - No authentication required
    } else {
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  uploadFileChunkHTTP,
  getAllFiles,
  getPrivateFiles,
  getFilesByAuthor,
  getFileTypesCounts,
  downloadFile
};
