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