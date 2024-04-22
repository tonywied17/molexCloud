/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\routes\authRoutes.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Friday April 12th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon April 22nd 2024 7:44:23 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const routes = [
  {
    method: 'get',
    path: '/generate',
    middleware: [authenticateToken],
    handler: authController.generateInviteCode,
    description: 'Generate invite code',
    prefix: '/auth'
  },
  {
    method: 'get',
    path: '/invite-codes',
    middleware: [authenticateToken],
    handler: authController.getUserInviteCodes,
    description: 'Get user invite codes',
    prefix: '/auth'
  },
  {
    method: 'post',
    path: '/register',
    middleware: [],
    handler: authController.register,
    description: 'Register',
    prefix: '/auth'
  },
  {
    method: 'post',
    path: '/login',
    middleware: [],
    handler: authController.login,
    description: 'Login',
    prefix: '/auth'
  },
  {
    method: 'delete',
    path: '/invite-codes/:codeId',
    middleware: [authenticateToken],
    handler: authController.deleteUserInviteCode,
    description: 'Delete user invite code',
    prefix: '/auth'
  }
];

routes.forEach(route => {
  const { method, path, middleware, handler, description } = route;
  router[method](path, ...middleware, handler);
  console.log(`Registered route: [${method.toUpperCase()}] ${path} - ${description}`);
});

module.exports = { router, routes };