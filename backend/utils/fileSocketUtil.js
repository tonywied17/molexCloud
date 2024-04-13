const fs = require('fs');
const path = require('path');
const File = require('../models/File');

// ? Set initial variables
let metadataReceived = false;
let metadata = {};
let writeStream;
let totalBytesSent = 0;

// ! Handle web socket messages (metadata:json | file: binary) for file upload
async function handleFileUpload(ws, data) {
  try {
    if (!metadataReceived && typeof data === 'object' && data.hasOwnProperty('filename')) {
      metadataReceived = true;
      metadata = data;
      await handleMetadata(ws);
    } else if (data.type === 'file_resume') {
      const resumeOffset = parseInt(data.payload);
      console.log('Received file resume request at byte:', resumeOffset);
      if (writeStream) {
        writeStream.end();
        totalBytesSent = resumeOffset;
        writeStream = fs.createWriteStream(writeStream.path, { flags: 'a' });
        ws.send(JSON.stringify({ type: 'file_resume', payload: resumeOffset }));
      } else {
        console.error('No writeStream defined. Cannot resume upload.');
        ws.send(JSON.stringify({ error: 'No writeStream defined. Cannot resume upload.' }));
      }
    } else {
      await handleChunk(ws, data);
    }
  } catch (error) {
    console.error('Error handling file upload:', error);
    ws.send(JSON.stringify({ error: 'Internal server error' }));
  }
}

//! Handle metadata for file upload (This is sent first)
async function handleMetadata(ws) {
  const { filename, size, isPrivate } = metadata;
  const rand = randomString();
  const finalFilePath = path.join(__dirname, `../../uploads/${rand}`);
  const filePath = path.join(finalFilePath, filename);

  await fs.promises.mkdir(finalFilePath, { recursive: true });

  writeStream = fs.createWriteStream(filePath);

  ws.on('close', async () => {
    writeStream.end();

    if (totalBytesSent === size) {
      console.log(`File ${filename} uploaded successfully.`);
      ws.send(JSON.stringify({ success: true }));
    } else {
      fs.unlinkSync(filePath);
      console.log(`File ${filename} transfer failed.`);
      ws.send(JSON.stringify({ error: 'File transfer failed' }));
    }
  });
}


// ! Handle file chunk over websocket
const UPLOAD_TIMEOUT = 60000; //? If no data chunks are received for 60 secs
let uploadTimer;
async function handleChunk(ws, chunkData) {
  if (!metadataReceived) {
    console.error('Metadata not received first.');
    ws.send(JSON.stringify({ error: 'Metadata not received first' }));
    return;
  }

  if (!writeStream) {
    console.error('writeStream is not defined.');
    ws.send(JSON.stringify({ error: 'Internal server error: writeStream is not defined' }));
    return;
  }

  clearTimeout(uploadTimer);

  uploadTimer = setTimeout(() => {
    writeStream.end();
    fs.unlinkSync(writeStream.path);
    console.log(`File upload timed out for ${metadata.filename}. File deleted.`);
    ws.send(JSON.stringify({ error: 'File upload timed out' }));
    ws.close();
  }, UPLOAD_TIMEOUT);

  const endOfFileMarker = 'file_upload_end';
  const markerIndex = chunkData.indexOf(endOfFileMarker);

  if (markerIndex !== -1) {
    ws.send(JSON.stringify({ success: true }));
    console.log('End of file marker found.');
    const chunk = Buffer.from(chunkData.slice(0, markerIndex));
    writeStream.write(chunk, 'binary');

    writeStream.end();

    console.log('File upload ended. Closing connection and inserting record.');

    const { filename } = metadata;
    const filePath = writeStream.path;
    const { fileTypeFromFile } = await import('file-type');
    const type = await fileTypeFromFile(filePath)
    const fileTypeString = type ? (type.mime || type.ext || 'unknown') : 'unknown';

    const existingFile = await File.findOne({ where: { filename: filename } });
    if (existingFile) {
      console.log('File already exists. Updating record...');
      await existingFile.update({
        filename: filename,
        path: filePath,
        isPrivate: metadata.isPrivate,
        fileType: fileTypeString
      });
    } else {
      console.log('Creating file record...');
      await File.create({
        filename: filename,
        path: filePath,
        isPrivate: metadata.isPrivate,
        fileType: fileTypeString
      });
    }

    ws.close();
    clearTimeout(uploadTimer);

    //? Clear variables
    metadataReceived = false;
    metadata = {};
    writeStream = null;
    totalBytesSent = 0;

  } else {
    const chunk = Buffer.from(chunkData);
    writeStream.write(chunk, 'binary');
    totalBytesSent += chunk.byteLength;
  }
}

function randomString() {
  return Math.random().toString(36).substring(2, 7);
}

module.exports = {
  handleFileUpload
};
