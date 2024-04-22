/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\middleware\authMiddleware.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Friday April 12th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon April 22nd 2024 7:44:51 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const jwt = require('jsonwebtoken');
require("dotenv").config({ path: "/home/tbz/envs/molexCloud/.env" });
//! Authenticate token middleware
// req: Request object
// res: Response object
// next: Next middleware function
// Check if token is provided and valid
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
};
