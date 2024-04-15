const express = require('express');
const bodyParser = require('body-parser');
const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes');
const sequelize = require('./config/database');
const path = require('path');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const WebSocket = require('ws');
const https = require('https'); 
const fs = require('fs');
const { FileUploadSession } = require('./utils/fileSocketUtil');
require('dotenv').config();

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

//! Routes
app.use('/files', fileRoutes);
app.use('/auth', authRoutes);

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

//! File upload middleware
app.use(fileUpload(
  {
    limits: { fileSize: Infinity },
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached',
  }
));

/**
 * * --- Websocket server ---
 */
//! Websocket server
const wss = new WebSocket.Server({ server: httpsServer });
const activeSessions = new Map();

// ! Websocket connection
wss.on('connection', (ws) => {
console.log('WebSocket connection opened');

  // ? Create new file upload session
  const session = new FileUploadSession(ws);
  activeSessions.set(session.id, session); 

  // ! Websocket message
  ws.on('message', async (message) => {
    try {
      // ? Get active session
      const activeSession = activeSessions.get(session.id);
      if (!activeSession) {
        console.error('Session not found.');
        return;
      }

      // * No metadata received yet
      if (!session.metadataReceived) {
        const data = JSON.parse(message);

        // ? Handle file upload metadata
        if (data.type === 'file_upload_metadata') {
          await session.handleFileUpload(data.payload);

        } else {
          console.error('Invalid message format: Metadata not received first');
          session.ws.send(JSON.stringify({ error: 'Invalid message format: Metadata not received first' }));
        }

      // * Metadata received
      } else {

        // ? Handle file chunk
        if (Buffer.isBuffer(message)) {
          await session.handleChunk(message);
          
        } else {
          console.error('Invalid message format: Expected file chunk');
          session.ws.send(JSON.stringify({ error: 'Invalid message format: Expected file chunk' }));
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      const session = activeSessions.get(session.id);
      if (session) {
        session.ws.send(JSON.stringify({ error: 'Invalid message format' }));
      } else {
        console.error('Session is not defined.');
      }
    }
  });

  //! Websocket close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    
    // ? Remove session from active sessions
    const activeSession = activeSessions.get(session.id);
    if (activeSession) {
      activeSessions.delete(session.id);
    }
  });
});

sequelize.sync();
