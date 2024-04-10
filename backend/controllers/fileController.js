const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const jwt = require('jsonwebtoken');

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
    const { chunkUrl, originalname, totalChunks, isPrivate } = req.body;
    
    const userId = req.user.userId.toString();
    const timestamp = Date.now();
    const filename = `${timestamp}-${originalname}`;
    const uploadDirectory = path.join(__dirname, '../../uploads');
    const userUploadDirectory = path.join(uploadDirectory, userId);

    // Ensure directory exists
    fs.mkdirSync(userUploadDirectory, { recursive: true });

    console.log('Uploading file:', filename);
    console.log('Total chunks:', totalChunks);
    console.log('Is private:', isPrivate);
    console.log('User ID:', userId);
    console.log('User upload directory:', userUploadDirectory);


    // Store all chunks in an array
    const chunkDataArray = [];
    for (let i = 1; i <= totalChunks; i++) {
      const chunk = req.files[`chunk${i}`];
      console.log(`Chunk ${i}`, chunk);
      const response = await axios.get(chunkUrl, { responseType: 'blob' });
      const chunkData = await response.data;
      console.log(`Chunk ${i} data length:`, chunkData.length);
      chunkDataArray.push(chunkData);
    }

    // Concatenate all chunks
    const concatenatedData = Buffer.concat(chunkDataArray);
    console.log('Concatenated data length:', concatenatedData.length);

    // Write concatenated data to the file
    const filePath = path.join(userUploadDirectory, filename);
    await fs.promises.writeFile(filePath, concatenatedData);

    // Check if file exists after writing
    const fileExists = await fs.promises.access(filePath, fs.constants.F_OK);
    console.log('File exists after writing:', fileExists);

    await File.create({
      filename: filename,
      path: filePath,
      isPrivate: isPrivate,
      fileType: 'png' 
    });

    console.log('File uploaded successfully:', filename);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Internal server error');
  }
}

module.exports = {
  getAllFiles,
  getPrivateFiles,
  uploadFileChunk
};
