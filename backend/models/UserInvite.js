/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\models\UserInvite.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Tuesday April 16th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon April 22nd 2024 7:44:33 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

//! Define the UserInvite model
const UserInvite = sequelize.define('UserInvite', {
  code: { type: DataTypes.STRING, unique: true },
  isUsed: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = UserInvite;