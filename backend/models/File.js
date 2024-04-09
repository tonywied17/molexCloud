const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const File = sequelize.define('File', {
  filename: DataTypes.STRING,
  path: DataTypes.STRING,
  isPrivate: DataTypes.BOOLEAN,
  fileType: DataTypes.STRING
});

module.exports = File;
