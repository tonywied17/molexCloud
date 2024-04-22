const express = require('express');
const bodyParser = require('body-parser');
const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes');
const plexRoutes = require('./routes/plexRoutes');
const path = require('path');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const WebSocket = require('ws');
const https = require('https'); 
const fs = require('fs');
const { FileUploadSession } = require('./sessions/FileUploadSession');
require('dotenv').config();
const { Sequelize } = require("./models");
const { v4: uuidv4 } = require('uuid');

/**
 * * --- Express Server ---
 */
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
app.use('/files', fileRoutes);
app.use('/auth', authRoutes);
app.use('/plex', plexRoutes)

app.get('/', (req, res) => {
  res.json({ 
    message: 'Molex Cloud API',
    endpoints: {
      files: {
        publicFiles: '/files',
        privateFiles: '/files/private',
        fileTypes: '/files/filetypes',
        downloadFile: '/files/download/:id',
        uploadFile: '/files/upload/chunk',
        deleteFile: '/files/:id',
      },
      auth: {
        login: '/auth/login',
        register: '/auth/register',
      }
    } 
  });
});


/**
 * * --- Websocket server ---
 */
//! Websocket server
const wss = new WebSocket.Server({ server: httpsServer });
const activeSessions = new Map();
const sessionIDGeneration = uuidv4();

// ! Websocket connection
wss.on('connection', (ws) => {
console.log('WebSocket connection opened');

  // ? Create new file upload session
  const session = new FileUploadSession(ws, sessionIDGeneration);
  activeSessions.set(session.id, session); 

  // ! Websocket message
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

  //! Websocket close
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


Sequelize.sync().then(() => { 
  console.log("Shit synced");
});