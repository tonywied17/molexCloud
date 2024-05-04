/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\models\PlexItem.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Sunday April 21st 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Sat May 4th 2024 5:36:32 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

//! Define the PlexItem model
// title: Plex item title
// release_year: Plex item release year
// poster_url: Plex item poster URL
// plot: Plex item plot
// genre: Plex item genre
// directors: Plex item directors
// actors: Plex item actors
// runtime: Plex item runtime
// imdbRating: Plex item IMDb rating
// plexRating: Plex item Plex rating
const PlexItem = sequelize.define('PlexItem', {
    title: DataTypes.STRING,
    imdbID: DataTypes.STRING,
    release_year: DataTypes.STRING,
    poster_url: DataTypes.STRING,
    plot: DataTypes.STRING,
    genre: DataTypes.STRING,
    directors: DataTypes.STRING,
    actors: DataTypes.STRING,
    runtime: DataTypes.STRING,
    imdbRating: DataTypes.STRING,
    plexRating: DataTypes.STRING,
    plexUrl: DataTypes.STRING
});

module.exports = PlexItem;