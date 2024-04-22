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
  router[method](path, middleware, handler);
  console.log(`Registered route: [${method.toUpperCase()}] ${path} - ${description}`);
});

module.exports = { router, routes };