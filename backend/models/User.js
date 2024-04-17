const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

//! Define the User model
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING
});

module.exports = User;