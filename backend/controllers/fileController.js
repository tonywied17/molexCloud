const fs = require('fs');
const { promisify } = require('util');
const fsPromises = {
  ...fs,
  writeFile: promisify(fs.writeFile),
  mkdir: promisify(fs.mkdir),
  rmdir: promisify(fs.rmdir)
};
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const { pipeline } = require('stream/promises');
const { createReadStream, createWriteStream } = require('fs');

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
    res.json(files || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Upload file chunk
async function uploadFileChunk(req, res) {
  try {
    const isPrivate = req.headers.isprivate === 'true';
    const totalChunks = parseInt(req.headers.totalchunks);
    const chunkNumber = parseInt(req.headers.chunknumber);
    const userId = req.user.userId.toString();

    let chunk = req.files.chunk;
    const fileName = chunk.name;

    const tempDirectory = path.join(__dirname, '../../uploads/temp');
    await fsPromises.mkdir(tempDirectory, { recursive: true });

    const tempChunkDirectory = path.join(tempDirectory, uuidv4());
    await fsPromises.mkdir(tempChunkDirectory, { recursive: true });

    const filePath = path.join(tempChunkDirectory, fileName);

    await chunk.mv(filePath);

    const finalFilePath = path.join(__dirname, `../../uploads/${userId}/${fileName}`);
    await fsPromises.mkdir(path.dirname(finalFilePath), { recursive: true });
    const finalFile = createWriteStream(finalFilePath, { flags: 'a' });

    const readStream = createReadStream(filePath);
    await pipeline(readStream, finalFile);

    await fsPromises.rmdir(tempChunkDirectory, { recursive: true });

    console.log('Chunk ' + chunkNumber + '/' + totalChunks + ' uploaded successfully:', fileName);

    if (chunkNumber === totalChunks) {
      console.log('All chunks uploaded successfully');

      const { fileTypeFromFile } = await import('file-type');
      const type = await fileTypeFromFile(finalFilePath)
      const fileTypeString = type ? (type.mime || type.ext || 'unknown') : 'unknown';

      console.log('File type:', fileTypeString);

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
    }

    if (chunkNumber != totalChunks) {
      res.sendStatus(200);
    } else {
      res.sendStatus(201);
    }
  } catch (error) {
    console.error('Error uploading chunk:', error);
    res.status(500).send('Internal server error');
  }
}

module.exports = {
  uploadFileChunk,
  getAllFiles,
  getPrivateFiles
};
