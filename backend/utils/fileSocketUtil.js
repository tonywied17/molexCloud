const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const { v4: uuidv4 } = require('uuid');

//! File upload session class (Create a new instance for each file upload session)
class FileUploadSession {
  constructor(ws) {
    this.id = uuidv4();
    this.ws = ws;
    this.metadataReceived = false;
    this.metadata = {};
    this.writeStream = null;
    this.totalBytesSent = 0;
    this.totalSize = 0;
    this.uploadTimer = null;
    this.rand = randomString();
    this.finalFilePath = path.join(__dirname, `../../uploads/${this.rand}`);
    this.filePath = null;
  }

  //! Handle the file upload data payload (metadata or file chunk)
  async handleFileUpload(data) {
    try {
      if (!this.metadataReceived && typeof data === 'object' && data.hasOwnProperty('filename')) {
        this.metadataReceived = true;
        this.metadata = data;
        this.filePath = path.join(this.finalFilePath, this.metadata.filename);
        this.totalSize = data.size;
        await this.handleMetadata();
      } else if (data.type === 'file_resume') {
        if (this.writeStream) {
          this.writeStream.end();
          this.totalBytesSent = resumeOffset;
          this.writeStream = fs.createWriteStream(this.filePath, { flags: 'a' });
          this.ws.send(JSON.stringify({ type: 'file_resume', payload: resumeOffset }));
        } else {
          console.error('No writeStream defined. Cannot resume upload.');
          this.ws.send(JSON.stringify({ error: 'No writeStream defined. Cannot resume upload.' }));
        }
      } else {
        await this.handleChunk(data);
      }
    } catch (error) {
      console.error('Error handling file upload:', error);
      this.ws.send(JSON.stringify({ error: 'Internal server error' }));
    }
  }

  //! Handle metadata
  async handleMetadata() {
    const { filename, size, isPrivate } = this.metadata;

    await fs.promises.mkdir(this.finalFilePath, { recursive: true });
  
    this.writeStream = fs.createWriteStream(this.filePath);
  
    this.ws.on('close', async () => {
      this.writeStream.end();
      if (this.totalBytesSent === size) {
        console.log(`File ${filename} uploaded successfully.`);
        this.ws.send(JSON.stringify({ success: true }));
      } else {
        fs.unlinkSync(this.filePath);
        console.log(`File ${filename} transfer failed.`);
        this.ws.send(JSON.stringify({ error: 'File transfer failed' }));
      }
    });
  }

  //! Handle file chunk
  async handleChunk(chunkData) {
    try {
      if (!this.metadataReceived) {
        console.error('Metadata not received first.');
        this.ws.send(JSON.stringify({ error: 'Metadata not received first' }));
        return;
      }

      clearTimeout(this.uploadTimer);

      this.uploadTimer = setTimeout(() => {
        this.writeStream.end();
        fs.unlinkSync(this.filePath);
        console.log(`File upload timed out for ${this.metadata.filename}. File deleted.`);
        this.ws.send(JSON.stringify({ error: 'File upload timed out' }));
        this.ws.close();
      }, UPLOAD_TIMEOUT);

      const endOfFileMarker = 'file_upload_end';
      const markerIndex = chunkData.indexOf(endOfFileMarker);

      if (markerIndex !== -1) {

        this.ws.send(JSON.stringify({ success: true }));
        console.log('End of file marker found.');
        const chunk = Buffer.from(chunkData.slice(0, markerIndex));

        this.writeStream.write(chunk, 'binary');

        this.writeStream.end();

        console.log('File upload ended. Closing connection and inserting record.');

        const { filename, isPrivate, mimeType } = this.metadata;

        const existingFile = await File.findOne({ where: { filename: filename } });
        if (existingFile) {
          console.log('File already exists. Updating record...');
          await existingFile.update({
            filename: filename,
            path: this.filePath,
            isPrivate: isPrivate,
            fileType: mimeType || 'unknown'
          });
        } else {
          console.log('Creating file record...');
          await File.create({
            filename: filename,
            path: this.filePath,
            isPrivate: isPrivate,
            fileType: mimeType || 'unknown'
          });
        }

        this.ws.close();
        clearTimeout(this.uploadTimer);

        this.metadataReceived = false;
        this.metadata = {};
        this.writeStream = null;
        this.totalBytesSent = 0;
        
      } else {
        const chunk = Buffer.from(chunkData);
        this.writeStream.write(chunk, 'binary');
        this.totalBytesSent += chunk.byteLength;
      }
    } catch (error) {
      console.error('Error handling file chunk:', error);
      this.ws.send(JSON.stringify({ error: 'Internal server error' }));
    }
  }
}

const UPLOAD_TIMEOUT = 60000;

function randomString() {
  return Math.random().toString(36).substring(2, 7);
}

module.exports = { FileUploadSession };
