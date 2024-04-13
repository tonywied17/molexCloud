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

function randomString() {
  return Math.random().toString(36).substring(2, 7);
}

module.exports = {
  uploadFileChunkHTTP,
  getAllFiles,
  getPrivateFiles
};
