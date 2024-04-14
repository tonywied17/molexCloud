const express = require('express');
const bodyParser = require('body-parser');
const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes');
const sequelize = require('./config/database');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const WebSocket = require('ws');
const { FileUploadSession } = require('./utils/fileSocketUtil');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3222;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(fileUpload());

//! Routes
app.use('/api/files', fileRoutes);
app.use('/api/auth', authRoutes);

//! Express Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//! Websocket server
const wss = new WebSocket.Server({ server });

const activeSessions = new Map();

wss.on('connection', (ws) => {
  const session = new FileUploadSession(ws);
  activeSessions.set(session.id, session); 

  ws.on('message', async (message) => {
    try {
      const activeSession = activeSessions.get(session.id);
      if (!activeSession) {
        console.error('Session not found.');
        return;
      }

      if (!session.metadataReceived) {
        const data = JSON.parse(message);
        if (data.type === 'file_upload_metadata') {
          await session.handleFileUpload(data.payload);
        } else {
          console.error('Invalid message format: Metadata not received first');
          session.ws.send(JSON.stringify({ error: 'Invalid message format: Metadata not received first' }));
        }
      } else {
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

  ws.on('close', () => {
    const activeSession = activeSessions.get(session.id);
    if (activeSession) {
      activeSessions.delete(session.id);
    }
  });
});

sequelize.sync();
