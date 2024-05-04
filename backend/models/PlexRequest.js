/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\models\PlexRequest.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Wednesday May 1st 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Sat May 4th 2024 5:33:37 
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
    imdbID: {
        type: DataTypes.STRING,
        allowNull: true
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
