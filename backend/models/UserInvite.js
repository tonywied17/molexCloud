const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

//! Define the UserInvite model
const UserInvite = sequelize.define('UserInvite', {
  code: { type: DataTypes.STRING, unique: true },
  isUsed: { type: DataTypes.BOOLEAN, defaultValue: false },
  userId: { type: DataTypes.INTEGER }
});

module.exports = { 
  UserInvite
};