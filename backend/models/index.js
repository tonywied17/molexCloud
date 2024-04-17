

const sequelize = require("../config/database.js");
const User = require("./User");
const UserInvite = require("./UserInvite");
const File = require("./File");

const db = {
    User,
    UserInvite,
    File
};

// A user can have many invites
User.hasMany(UserInvite, { foreignKey: "UserId" });
UserInvite.belongsTo(User, { foreignKey: "UserId" });

// A user can have many files
User.hasMany(File, { foreignKey: "UserId" });
File.belongsTo(User, { foreignKey: "UserId" });

module.exports = {
    Sequelize: sequelize,
    File: db.File,
    User: db.User,
    UserInvite: db.UserInvite
};
