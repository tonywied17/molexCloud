/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\controllers\fileController.js
 * Project: c:\Users\tonyw\AppData\Local\Temp\scp15599\public_html\test\api\controllers
 * Created Date: Tuesday April 16th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Sat April 27th 2024 7:22:35 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

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
const { File } = require('../models');
const { pipeline } = require('stream/promises');
const { authenticateToken } = require('../middleware/authMiddleware');
const { calculateDirectorySize, addDirectoryToArchive } = require('./utils/helpers');
const archiver = require('archiver');

//! Get all files
//? Get all files from the database
async function getAllFiles(req, res) {
  try {
    let privateFiles = [];
    let publicFiles = [];
    let userFiles = [];
    let privateFileTypeCounts = {};
    let userFileTypeCounts = {};

    publicFiles = await File.findAll({
      where: { isPrivate: false }
    });
    //? Authenticated Request - Include private and public files
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
          for (const file of publicAndPrivateFiles) {
            const filePath = file.path;
            if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
              file.fileType = 'inode/directory';
              file.fileSize = await calculateDirectorySize(filePath);
            }
          }
          const publicFileTypeCounts = publicFiles.reduce((counts, file) => {
            counts[file.fileType] = (counts[file.fileType] || 0) + 1;
            return counts;
          }, {});
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
      for (const file of publicFiles) {
        const filePath = file.path;
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          file.fileType = 'inode/directory';
          file.fileSize = await calculateDirectorySize(filePath);
        }
      }
      const publicFileTypeCounts = publicFiles.reduce((counts, file) => {
        counts[file.fileType] = (counts[file.fileType] || 0) + 1;
        return counts;
      }, {});

      res.json({ publicFiles, publicFileTypeCounts });

    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


//! Upload file chunk via HTTP
//? Upload a file chunk to the server via HTTP
async function uploadFileChunkHTTP(req, res) {
  try {
    const isPrivate = req.headers.isprivate === 'true';
    const totalChunks = parseInt(req.headers.totalchunks);
    const chunkNumber = parseInt(req.headers.chunknumber);
    const fileName = req.files.chunk.name;
    let chunk = req.files.chunk;

    const sessionId = req.body.sessionId;
    const fileType = req.body.fileType;

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

        console.log('Creating file record...');
        await File.create({
          filename: fileName,
          path: finalFilePath,
          isPrivate: isPrivate,
          fileType: fileType,
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

//! Create file record only for ftp upload
//? Create a file record in the database for a file uploaded via FTP
async function createFileRecord(req, res) {
  try {
    const fileName = req.body.filename;
    const fileType = req.body.fileType;
    const fileSize = req.body.fileSize;
    const isPrivate = req.body.isPrivate;
    const author = req.body.author;
    const userId = req.user.userId;
    const finalFilePath = '/home/tbz' + req.body.path;

    console.log(req.body)

    const file = await File.create({
      filename: fileName,
      path: finalFilePath,
      isPrivate: isPrivate,
      fileType: fileType,
      fileSize: fileSize,
      author: author,
      downloads: 0,
      UserId: userId,
    });
    console.log('File record created successfully:', file);
    res.json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Download a file or directory
//? Download a file or directory as a zip archive from the server
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

    if (fs.statSync(filePath).isDirectory()) {
      const zipFileName = file.filename + '.zip';
      const zipFilePath = path.join(__dirname, '../../temp', zipFileName);

      await fsPromises.mkdir(path.dirname(zipFilePath), { recursive: true });

      const zipOutput = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      zipOutput.on('close', () => {
        file.downloads += 1;
        file.save();
        
        res.download(zipFilePath, zipFileName, (err) => {
          if (err) {
            console.error('Error downloading zip file:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            fs.unlink(zipFilePath, (err) => {
              if (err) {
                console.error('Error deleting temporary zip file:', err);
              }
            });
          }
        });
      });

      archive.on('error', (err) => {
        console.error('Error zipping directory:', err);
        res.status(500).json({ error: 'Internal server error' });
      });

      archive.pipe(zipOutput);
      await addDirectoryToArchive(archive, filePath, '');
      archive.finalize();
    } else {
      const contentType = file.fileType || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('X-Filename', file.filename);

      file.downloads += 1;
      file.save();
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Delete a file or directory
//? Delete a file or directory from the server and the database
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

    if (fs.statSync(filePath).isDirectory()) {
      await fsPromises.rmdir(filePath, { recursive: true });
    } else {
      await fsPromises.unlink(filePath);
    }

    res.json({ message: '[SUCCESS] File or directory deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  uploadFileChunkHTTP,
  getAllFiles,
  downloadFile,
  deleteFile,
  createFileRecord,
};
