const express = require('express');
const bodyParser = require('body-parser');
const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes');
const sequelize = require('./config/database');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3222;

app.use(bodyParser.json());

app.use('/api/files', fileRoutes);
app.use('/api/auth', authRoutes);

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
