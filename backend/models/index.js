/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\models\index.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Tuesday April 16th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon May 13th 2024 5:26:00 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */
const sequelize = require("../config/database.js");
const User = require("./User");
const UserInvite = require("./UserInvite");
const Role = require("./Role.js");
const PlexRequest = require("./PlexRequest.js");
const File = require("./File");
const PlexItem = require("./PlexItem");
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

async function initializeTables() {
    try {

        const User_Roles = sequelize.define('User_Roles', {
            UserId: {
              type: DataTypes.INTEGER,
              primaryKey: true,
            },
            RoleId: {
              type: DataTypes.INTEGER,
              primaryKey: true,
            },
          });
        

        // A user can have many roles
        User.belongsToMany(Role, { through: User_Roles });
        Role.belongsToMany(User, { through: User_Roles });

        // A user can create many invite codes
        User.hasMany(UserInvite, { foreignKey: "UserId" });
        UserInvite.belongsTo(User, { foreignKey: "UserId" });

        // A file belongs to a user
        User.hasMany(File, { foreignKey: "UserId" });
        File.belongsTo(User, { foreignKey: "UserId" });
        
        console.log('Tables were initialized successfully.');
    } catch (error) {
        console.error('Error initializing tables:', error);
    }
}

async function initializeRoles() {
    try {
        // Create admin and user roles
        const adminRole = await Role.create({ name: 'admin' });
        const userRole = await Role.create({ name: 'user' });

        // Find or create a 'molex'
        let molex = await User.findOne({ where: { username: 'molex' } });
        if (!molex) {
            const hashedPassword = await bcrypt.hash('test123', 10);
            molex = await User.create({ username: 'molex', password: hashedPassword });
        }

        await molex.addRole(adminRole);
        await molex.addRole(userRole);

        // create dev invite codes pib and 23307
        const pib = await UserInvite.create({ code: 'pib', UserId: molex.id });
        const _23307 = await UserInvite.create({ code: '23307', UserId: molex.id });

        console.log('Roles were initialized successfully.');
    } catch (error) {
        console.error('Error initializing roles:', error);
    }
}


async function initializeDatabase() {
    try {
        // Initialize tables
        await initializeTables();
        await sequelize.sync({ force: false });
        console.log('All models were synchronized successfully.');
        console.log('Tables were initialized successfully.');

        // Initialize roles
        await initializeRoles();
        console.log('Roles were initialized successfully.');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Call the initialization function
initializeDatabase();

module.exports = {
    Sequelize: sequelize,
    File: File,
    User: User,
    UserInvite: UserInvite,
    Role: Role,
    PlexRequest: PlexRequest,
    PlexItem: PlexItem
};