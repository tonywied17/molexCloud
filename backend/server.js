const express = require('express');
const bodyParser = require('body-parser');
const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes');
const sequelize = require('./config/database');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const WebSocket = require('ws');
const { handleFileUpload } = require('./utils/fileSocketUtil');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3222;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(fileUpload());

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/auth', authRoutes);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let metadataReceived = false;

  ws.on('message', async (message) => {
    try {
      console.log('Received message:', message);

      if (!metadataReceived) {
        const data = JSON.parse(message);
        if (data.type === 'file_upload_metadata') {
          metadataReceived = true;
          await handleFileUpload(ws, data.payload);
        } else {
          console.error('Invalid message format: Metadata not received first');
          ws.send(JSON.stringify({ error: 'Invalid message format: Metadata not received first' }));
        }
      } else {
        if (Buffer.isBuffer(message)) {
          handleFileUpload(ws, message);
        } else {
          console.error('Invalid message format: Expected file chunk');
          ws.send(JSON.stringify({ error: 'Invalid message format: Expected file chunk' }));
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });
});

sequelize.sync();
