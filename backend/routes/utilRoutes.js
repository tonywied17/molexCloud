const express = require('express');
const router = express.Router();
const helpers = require('../controllers/utils/helpers');

const routes = [
  {
    method: 'get',
    path: '/steam-id',
    middleware: [],
    handler: helpers.getSteamId,
    description: 'Get Steam ID from Steam profile URL',
    prefix: '/utils'
  }
];

routes.forEach(route => {
  const { method, path, middleware, handler, description } = route;
  router[method](path, ...middleware, handler);
  console.log(`Registered route: [${method.toUpperCase()}] ${path} - ${description}`);
});

module.exports = { router, routes };
