/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\server.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Friday April 12th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon April 22nd 2024 7:42:20 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const { FileUploadSession } = require('./sessions/FileUploadSession');
const { Sequelize } = require("./models");
const { v4: uuidv4 } = require('uuid');

require("dotenv").config({ path: "/home/tbz/envs/molexCloud/.env" });

//! Express server setup
// ? SSL certificate paths
const privateKeyPath = path.resolve(__dirname, 'live/molex.cloud/privkey.pem');
const certificatePath = path.resolve(__dirname, 'live/molex.cloud/fullchain.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const certificate = fs.readFileSync(certificatePath, 'utf8');
const credentials = { key: privateKey, cert: certificate };

const app = express();
const PORT = process.env.PORT || 3222;

//! Create HTTPS server
const httpsServer = https.createServer(credentials, app);

//! Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//! Express Server
httpsServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//! File upload middleware
app.use(fileUpload(
  {
    limits: { fileSize: Infinity },
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached',
  }
));

//! Routes
const { router: fileRoutes, routes: fileRoutesArray } = require('./routes/fileRoutes');
const { router: authRoutes, routes: authRoutesArray } = require('./routes/authRoutes');
const { router: plexRoutes, routes: plexRoutesArray } = require('./routes/plexRoutes');
app.use('/files', fileRoutes);
app.use('/auth', authRoutes);
app.use('/plex', plexRoutes);

//! API Documentation endpoint
const endpoints = {
  message: 'Molex Cloud API',
  endpoints: {}
};
//? Build endpoint object for API documentation
[fileRoutesArray, authRoutesArray, plexRoutesArray].forEach(routesArray => {
  routesArray.forEach(route => {
    const { method, path, middleware, description, prefix } = route;

    let routeInfo = {
      description: description
    };

    if (middleware.length > 0) {
      let middlewareObject = {};
      middleware.forEach(m => {
        if (m.name === 'authenticateToken') {
          middlewareObject[m.name] = 'Verifies JWT token signature';
        } else if (m.name === 'authenticateBearerToken') {
          middlewareObject[m.name] = 'Checks authorization headers for bearer token';
        } else {
          middlewareObject[m.name] = 'No description available';
        }
      });
      routeInfo.middleware = middlewareObject;
    }

    if (!endpoints.endpoints[prefix]) {
      endpoints.endpoints[prefix] = {};
    }

    if (!endpoints.endpoints[prefix][method.toUpperCase()]) {
      endpoints.endpoints[prefix][method.toUpperCase()] = {};
    }

    endpoints.endpoints[prefix][method.toUpperCase()][path] = routeInfo;
  });
});

// ? API Documentation endpoint (https://molex.cloud/api)
app.get('/', (req, res) => {
  const prettyEndpoints = JSON.stringify(endpoints, null, 2);
  res.header('Content-Type', 'application/json');
  res.send(prettyEndpoints);
});


//! Websocket server
const wss = new WebSocket.Server({ server: httpsServer });
const activeSessions = new Map();
const sessionIDGeneration = uuidv4();

//? Websocket connection and session handling
wss.on('connection', (ws) => {
  console.log('WebSocket connection opened');
  const session = new FileUploadSession(ws, sessionIDGeneration);
  activeSessions.set(session.id, session);

  //? Websocket message
  ws.on('message', async (message) => {
    try {
      const activeSession = activeSessions.get(session.id);
      if (!activeSession) {
        console.error('Session not found.');
        return;
      }

      if (!activeSession.metadataReceived) {
        const data = JSON.parse(message);
        if (data.type === 'file_upload_metadata') {
          await activeSession.handleFileUpload(data.payload);
        } else {
          console.error('Invalid message format: Metadata not received first');
          activeSession.ws.send(JSON.stringify({ error: 'Invalid message format: Metadata not received first' }));
        }
      } else {
        if (Buffer.isBuffer(message)) {
          await activeSession.handleChunk(message);
        } else {
          console.error('Invalid message format: Expected file chunk');
          activeSession.ws.send(JSON.stringify({ error: 'Invalid message format: Expected file chunk' }));
        }
      }
    } catch (error) {
      console.error('Error during file upload:', error);
      const activeSession = activeSessions.get(session.id);
      if (activeSession.writeStream) {
        activeSession.writeStream.end();
      }
      activeSession.ws.send(JSON.stringify({ error: 'An error occurred during file upload. Please retry.' }));
    }
  });

  //? Websocket close
  ws.on('close', () => {
    const activeSession = activeSessions.get(session.id);
    if (activeSession) {
      activeSessions.delete(session.id);
      if (activeSession.writeStream) {
        activeSession.writeStream.end();
      }
    }
  });
});

//! Sequelize database sync
Sequelize.sync().then(() => {
  console.log("Sequelize shit synced");
});