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
