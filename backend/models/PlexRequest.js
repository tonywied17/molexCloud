/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\models\PlexRequest.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Wednesday May 1st 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Wed May 1st 2024 8:50:18 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

//! Define the UserReuqest model
const PlexRequest = sequelize.define('PlexRequest', {
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    request: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending'
    },
});

module.exports = PlexRequest;
