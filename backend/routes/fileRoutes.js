/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\routes\fileRoutes.js
 * Project: c:\Users\tonyw\AppData\Local\Temp\scp15216\public_html\test\api\routes
 * Created Date: Friday April 12th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Sat April 27th 2024 7:21:09 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateBearerToken } = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

const routes = [
  {
    method: 'get',
    path: '/',
    middleware: [],
    handler: fileController.getAllFiles,
    description: 'Get all files',
    prefix: '/files'
  },
  {
    method: 'get',
    path: '/:id',
    middleware: [],
    handler: fileController.downloadFile,
    description: 'Download file',
    prefix: '/files'
  },
  {
    method: 'post',
    path: '/upload/chunk',
    middleware: [authenticateToken],
    handler: fileController.uploadFileChunkHTTP,
    description: 'Upload file chunk',
    prefix: '/files'
  },
  {
    method: 'post',
    path: '/record',
    middleware: [authenticateToken],
    handler: fileController.createFileRecord,
    description: 'Create file record',
    prefix: '/files'
  },
  {
    method: 'delete',
    path: '/:id',
    middleware: [authenticateToken],
    handler: fileController.deleteFile,
    description: 'Delete file',
    prefix: '/files'
  }
];

routes.forEach(route => {
  const { method, path, middleware, handler, description } = route;
  router[method](path, ...middleware, handler);
  console.log(`Registered route: [${method.toUpperCase()}] ${path} - ${description}`);
});

module.exports = { router, routes };