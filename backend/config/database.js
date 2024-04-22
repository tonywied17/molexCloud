/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\config\database.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Friday April 12th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon April 22nd 2024 7:45:35 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// ! Create a new Sequelize instance
// ? Dialect: sqlite
// ? Storage: database/database.sqlite
// @TODO Use remote database in production maybe
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/database.sqlite')
});

module.exports = sequelize;
