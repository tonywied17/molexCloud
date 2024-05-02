/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\models\index.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Tuesday April 16th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Wed May 1st 2024 8:50:26 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const sequelize = require("../config/database.js");
const User = require("./User");
const UserInvite = require("./UserInvite");
const PlexRequest = require("./PlexRequest.js");
const File = require("./File");
const PlexItem = require("./PlexItem");

const db = {
    User,
    UserInvite,
    PlexRequest,
    File,
    PlexItem
};

//! Define relationships
//? A user can create man invite codes
User.hasMany(UserInvite, { foreignKey: "UserId" });
UserInvite.belongsTo(User, { foreignKey: "UserId" });

// User.hasMany(PlexRequest, { foreignKey: "UserId" });
// PlexRequest.belongsTo(User, { foreignKey: "UserId" });

//? A file belongs to a user
User.hasMany(File, { foreignKey: "UserId" });
File.belongsTo(User, { foreignKey: "UserId" });

module.exports = {
    Sequelize: sequelize,
    File: db.File,
    User: db.User,
    UserInvite: db.UserInvite,
    PlexRequest: db.PlexRequest,
    PlexItem: db.PlexItem
};
