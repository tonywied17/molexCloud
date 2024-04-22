/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\models\index.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Tuesday April 16th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon April 22nd 2024 7:43:44 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const sequelize = require("../config/database.js");
const User = require("./User");
const UserInvite = require("./UserInvite");
const File = require("./File");
const PlexItem = require("./PlexItem");
const db = {
    User,
    UserInvite,
    File,
    PlexItem
};

//! Define relationships
//? A user can create man invite codes
User.hasMany(UserInvite, { foreignKey: "UserId" });
UserInvite.belongsTo(User, { foreignKey: "UserId" });

//? A file belongs to a user
User.hasMany(File, { foreignKey: "UserId" });
File.belongsTo(User, { foreignKey: "UserId" });

module.exports = {
    Sequelize: sequelize,
    File: db.File,
    User: db.User,
    UserInvite: db.UserInvite,
    PlexItem: db.PlexItem
};
