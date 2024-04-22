/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\models\File.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Tuesday April 16th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon April 22nd 2024 7:44:44 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

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
