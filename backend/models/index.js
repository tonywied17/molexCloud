

const config = require("../config/database.js");
const Sequelize = require("sequelize");


const sequelize = new Sequelize(config.DB, {
    dialect: config.dialect,
    storage: config.storage,
    logging: false,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

/**
 * Import all models
 */
db.User = require("./User.js")(sequelize, Sequelize);
db.UserInvite = require("./UserInvite.js")(sequelize, Sequelize);
db.File = require("./File.js")(sequelize, Sequelize);

/**
 * Define relationships
 * This is where we define the relationships between the models
 */
db.User.hasMany(db.UserInvite);
db.UserInvite.belongsTo(db.User);
db.User.hasMany(db.File);
db.File.belongsTo(db.User);


module.exports = db;