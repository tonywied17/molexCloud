/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\routes\plexRoutes.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Sunday April 21st 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon April 22nd 2024 7:44:11 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const express = require('express');
const router = express.Router();
const { authenticateBearerToken } = require('../middleware/authMiddleware');
const plexController = require('../controllers/plexController');

const routes = [
  {
    method: 'get',
    path: '/',
    middleware: [],
    handler: (req, res) => {
      res.json({ message: 'Plex API' });
    },
    description: 'Plex API',
    prefix: '/plex'
  },
  {
    method: 'get',
    path: '/plex-library-search',
    middleware: [],
    handler: plexController.plexLibrarySearch,
    description: 'Plex library search',
    prefix: '/plex'
  },
  {
    method: 'get',
    path: '/recently-added',
    middleware: [],
    handler: plexController.getRecentlyAddedByCount,
    description: 'Get recently added by count',
    prefix: '/plex'
  },
  {
    method: 'get',
    path: '/recently-added/:id',
    middleware: [],
    handler: plexController.getRecentlyAddedItem,
    description: 'Get recently added item',
    prefix: '/plex'
  },
  {
    method: 'post',
    path: '/webhook',
    middleware: [],
    handler: plexController.plexRecentlyAddedWebhook,
    description: 'Plex recently added webhook',
    prefix: '/plex'
  },
  {
    method: 'delete',
    path: '/recently-added/:id',
    middleware: [authenticateBearerToken],
    handler: plexController.deleteRecentlyAddedItem,
    description: 'Delete recently added item',
    prefix: '/plex'
  },
  {
    method: 'delete',
    path: '/recently-added',
    middleware: [authenticateBearerToken],
    handler: plexController.deleteAllRecentlyAdded,
    description: 'Delete all recently added',
    prefix: '/plex'
  },
  {
    method: 'delete',
    path: '/old-recently-added',
    middleware: [authenticateBearerToken],
    handler: plexController.deleteOldRecentlyAdded,
    description: 'Delete old recently added',
    prefix: '/plex'
  }
];

routes.forEach(route => {
  const { method, path, middleware, handler, description } = route;
  router[method](path, ...middleware, handler);
  console.log(`Registered route: [${method.toUpperCase()}] ${path} - ${description}`);
});

module.exports = { router, routes };
