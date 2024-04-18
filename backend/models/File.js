const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

//! Define the File model
// filename: File name
// path: File path
// isPrivate: Boolean value to indicate if file is private
// fileType: File MIME type
const File = sequelize.define('File', {
  filename: DataTypes.STRING,
  path: DataTypes.STRING,
  isPrivate: DataTypes.BOOLEAN,
  fileType: DataTypes.STRING,
  fileSize: DataTypes.INTEGER,
  author: DataTypes.STRING,
  downloads: DataTypes.INTEGER,
});

module.exports = File;
