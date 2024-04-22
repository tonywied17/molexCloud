/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\sessions\FileUploadSession.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Saturday April 13th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon April 22nd 2024 7:43:58 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const { v4: uuidv4 } = require('uuid');
// todo: send session id from client to backend with every message
let rand = uuidv4();
//! File upload session class (Create a new instance for each file upload session)
// ws: WebSocket instance
// id: Unique session ID
// metadataReceived: Boolean to check if metadata is received
// metadata: Object to store file metadata
// writeStream: WriteStream instance to write file chunks
// totalBytesSent: Total bytes sent
// totalSize: Total file size
// uploadTimer: Timeout to end file upload if no data is received
// rand: Random string to create a unique directory for each file upload
// finalFilePath: Final file path to store the uploaded file
// filePath: Temporary file path to store the uploaded file
// handleFileUpload: Method to handle file upload data payload
// handleChunk: Method to handle file chunk
class FileUploadSession {
  constructor(ws) {
    this.id = rand;
    this.ws = ws;
    this.ws.sessionId = rand;
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
  // data: { type: 'file_upload_metadata', payload: { filename: 'file.txt', isPrivate: true, mimeType: 'text/plain', size: 1024 } } - Store file metadata and create writeStream
  // data: Buffer (file chunk) - File chunk upload
  // data: { type: 'file_resume' } - Resume file upload
  async handleFileUpload(data) {
    try {
      if (!this.metadataReceived && typeof data === 'object' && data.hasOwnProperty('filename')) {
        this.metadataReceived = true;
        this.metadata = data;
        this.totalSize = data.size;
        this.filePath = path.join(this.finalFilePath, this.metadata.filename);
        await fs.promises.mkdir(this.finalFilePath, { recursive: true });
        this.writeStream = fs.createWriteStream(this.filePath, { flags: 'a', highWaterMark: 0 });
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

  //! Handle file chunk
  // chunkData: Buffer (file chunk) - File chunk upload
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
        clearTimeout(this.uploadTimer);
        this.ws.send(JSON.stringify({ success: true }));
        console.log('End of file marker found.');
        const chunk = Buffer.from(chunkData.slice(0, markerIndex));
  
        if (this.writeStream) {
          this.writeStream.write(chunk, 'binary');
        } else {
          console.error('WriteStream is null. Cannot write chunk.');
          return;
        }
  
        console.log('Total bytes sent:', this.totalBytesSent);
        console.log('File size:', this.totalSize);
  
        if (this.totalBytesSent === this.totalSize) {
          this.writeStream.end();
          console.log('File upload ended. Closing writeStream and inserting record.');
  
          const { filename, isPrivate, mimeType, userId, author } = this.metadata;
  
          console.log('Creating file record...');
          await File.create({
            filename: filename,
            path: this.filePath,
            isPrivate: isPrivate,
            fileType: mimeType || 'unknown',
            fileSize: this.totalSize,
            author: author,
            downloads: 0,
            UserId: userId
          });
  
          this.ws.close();
        }
      } else {
        const chunk = Buffer.from(chunkData);
  
        if (this.writeStream) {
          this.writeStream.write(chunk, 'binary');
          this.totalBytesSent += chunk.byteLength;
        } else {
          console.error('WriteStream is null. Cannot write chunk.');
          return;
        }
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