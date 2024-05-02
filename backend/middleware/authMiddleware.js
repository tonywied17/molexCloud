/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\middleware\authMiddleware.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Friday April 12th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Thu May 2nd 2024 7:11:22 
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

function isRole(role) {
  return function (req, res, next) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (!decodedToken.roles) {
        return res.status(403).json({ error: 'User roles not found in token' });
      }

      if (decodedToken.roles.includes(role)) {
        console.log(`User has ${role} role`);
        req.user = decodedToken;

        next();
      } else {
        res.status(403).json({ error: 'Insufficient permissions' });
      }
    });

  }
}

function authenticateAndAuthorize(role) {
  return function (req, res, next) {
    if (!role) {
      role = ['user'];
    }
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return res.status(403).json({ error: 'Token is invalid' });
      }

      if (!decodedToken.roles) {
        return res.status(403).json({ error: 'User roles not found in token' });
      }

      if (role && !decodedToken.roles.some(r => role.includes(r))) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user = decodedToken;
      next();
    });
  };
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
  isRole,
  authenticateAndAuthorize
};
