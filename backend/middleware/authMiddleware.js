/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\middleware\authMiddleware.js
 * Project: c:\Users\tonyw\AppData\Local\Temp\scp20950\public_html\test\api\middleware
 * Created Date: Friday April 12th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Thu May 2nd 2024 5:44:21 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const jwt = require('jsonwebtoken');
require("dotenv").config({ path: "/home/tbz/envs/molexCloud/.env" });

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      return res.status(403).json({ error: 'Token is invalid' });
    }
    req.user = decodedToken;
    next();
  });
}

function isAdmin(req, res, next) {
  if (req.user.roles.includes('admin')) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (!decodedToken.roles) {
        return res.status(403).json({ error: 'User roles not found in token' });
      }
      req.user = decodedToken;
    });
    console.log('User is admin');
    next();

  } else {
    res.status(403).json({ error: 'Insufficient permissions' });
  }
}

function isUser(req, res, next) {
  if (req.user.roles.includes('user')) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (!decodedToken.roles) {
        return res.status(403).json({ error: 'User roles not found in token' });
      }
      req.user = decodedToken;
    });
    console.log('User is user');
    next();

  } else {
    res.status(403).json({ error: 'Insufficient permissions' });
  }
}

// Bearer token middleware
function authenticateBearerToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token:', token);
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  if (token !== process.env.JWT_SECRET) {
    return res.status(403).json({ error: 'Token is invalid' });
  }
  console.log('Token is valid');
  next();
}

module.exports = {
  authenticateToken,
  authenticateBearerToken,
  isAdmin,
  isUser
};
