/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\models\User.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Tuesday April 16th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon April 22nd 2024 7:44:37 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

//! Define the User model
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
  totalDownloads: DataTypes.INTEGER,
});

module.exports = User;