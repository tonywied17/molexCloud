/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\controllers\plexController.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Monday April 22nd 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon May 13th 2024 6:20:27 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const { PlexItem, PlexRequest } = require('../models');
const axios = require('axios');
require("dotenv").config({ path: "/home/tbz/envs/molexCloud/.env" });
const { Op } = require('sequelize');

//! Reverse Proxy to Plex API on local machine
//? Create an axios instance to proxy requests to the Plex API on the local machine
const plexProxyApi = axios.create({
    baseURL: 'http://69.253.238.203:8222/api/v2',
    params: {
        apikey: process.env.PLEX_API_KEY
    }
});

//! Plex Library Search
//? Search for a movie or TV show in Plex library
const plexLibrarySearch = async (req, res) => {
    try {
        const { title } = req.query;

        const tvShowLibrary = await plexProxyApi.get('/?cmd=get_library_media_info&section_id=5&search=' + title);
        const movieLibrary = await plexProxyApi.get('/?cmd=get_library_media_info&section_id=8&search=' + title);

        res.json({ data: { tvShowLibrary: tvShowLibrary.data, movieLibrary: movieLibrary.data } });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//! Plex Recently Added Webhook
//? Save a recently added movie or TV show to the database
const plexRecentlyAddedWebhook = async (req, res) => {
    console.log(req.body.data);
    try {
        const {
            media_type,
            title,
            imdbID,
            release_year,
            poster_url,
            plot,
            genre,
            directors,
            actors,
            runtime,
            imdbRating,
            plexRating,
            plex_library_url,
        } = req.body.data;

        const plexItem = await PlexItem.create({
            media_type,
            title,
            imdbID,
            release_year,
            poster_url,
            plot,
            genre,
            directors,
            actors,
            runtime,
            imdbRating,
            plexRating,
            plexUrl: plex_library_url
        });
        const [showsRefreshData, moviesRefreshData] = await refreshPlexLibraries(title);

        console.log(`${title} added! Plex Libraries Refreshed!`);
        console.log(`checking for request with imdbID: ${imdbID}`)
        const plexRequest = await PlexRequest.findOne({ where: { imdbID: imdbID } });
        if (plexRequest) {
            await PlexRequest.update({ status: 'fulfilled' }, { where: { imdbID: imdbID } });
            console.log(`Plex request fulfilled`);
        }

        res.status(201).json({ message: 'Plex item saved successfully', data: plexItem, showsRefreshData, moviesRefreshData });
    } catch (error) {
        console.error('Error saving Plex item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//! Refresh Plex Libraries
//? Refresh Plex libraries after adding a new movie or TV show
const refreshPlexLibraries = async (title) => {
    try {
        const refreshShows = plexProxyApi.get('/?cmd=get_library_media_info&section_id=5&search=' + title + '&refresh=true');
        const refreshMovies = plexProxyApi.get('/?cmd=get_library_media_info&section_id=8&search=' + title + '&refresh=true');
        
        const [showsResponse, moviesResponse] = await Promise.all([refreshShows, refreshMovies]);
        return [showsResponse.data, moviesResponse.data];
    } catch (error) {
        console.error('Error refreshing Plex libraries:', error);
        throw error;
    }
};

//! Get recently added items by imdbID
const getAllRecentlyAddedbyImdbID = async (req, res) => {
    let isFound = false;
    try {
        const { imdbID } = req.params;
        console.log('Checking for item with imdbID:', imdbID);
        const plexItems = await PlexItem.findAll({ where: { imdbID: imdbID } });
        if(!plexItems.length) {
            isFound = false;
        } else {
            isFound = true;
        }
        res.json({ data: isFound });
    } catch (error) {
        console.error('Error fetching Plex items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


//! Get recently added items
//? Get recently added movies or TV shows from the database
const getRecentlyAddedByCount = async (req, res) => {
    try {
        let plexItems;

        const count = parseInt(req.query.count);

        if (!isNaN(count) && count > 0) {
            plexItems = await PlexItem.findAll({ 
                limit: count,
                order: [['createdAt', 'DESC']] 
            });
        } else {
            plexItems = await PlexItem.findAll({
                order: [['createdAt', 'DESC']] 
            });
        }

        res.json({ data: plexItems });
    } catch (error) {
        console.error('Error fetching Plex items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


//! Get a recently added movie or TV show by ID
//? Get a single recently added movie or TV show from the database
const getRecentlyAddedItem = async (req, res) => {
    try {
        let id = req.query.id;
        const plexItem = await PlexItem.findOne({ where: { id } });
        res.json({ data: plexItem });
    } catch (error) {
        console.error('Error fetching Plex item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//! Delete a recently added movie or TV show by ID
//? Delete a single recently added movie or TV show from the database
const deleteRecentlyAddedItem = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Deleting item with id:', id)
        await PlexItem.destroy({ where: { id } });
        res.json({ id, message: 'Plex item deleted successfully' });
    } catch (error) {
        console.error('Error deleting Plex items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//! Delete old recently added items (older than 30 days)
//? Delete all recently added items older than 30 days
const deleteOldRecentlyAdded = async () => {
    try {
        await PlexItem.destroy({
            where: {
                createdAt: {
                    [Op.lt]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });
    } catch (error) {
        console.error('Error deleting old Plex items:', error);
    }
}

//! Delete all recently added items
//? Delete all recently added items from the database
const deleteAllRecentlyAdded = async (req, res) => {
    try {
        await PlexItem.destroy({ where: {} });
        res.json({ message: 'All Plex item deleted successfully' });
    } catch (error) {
        console.error('Error deleting Plex items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//! Add a Plex request
// ? if plex request title exists don't add it to the database and return a message
const addPlexRequest = async (req, res) => {
    try {
        const { type, imdbID, request } = req.body;
        console.log('Request:', request);
        const plexRequest = await PlexRequest.findOne({ where: { request } });
        if (plexRequest) {
            console.log('Plex request already exists');
            return res.status(201).json({ message: 'Plex request already exists' });
        }
        await PlexRequest.create({ type, imdbID, request });
        res.json({ message: 'Plex request added successfully' });
    }
    catch (error) {
        console.error('Error adding Plex request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//! Get Plex requests by name
//? Get plex requests with name query parameter compare again 'request' column
const getPlexRequestsByName = async (req, res) => {
    try {
        const { name } = req.query;
        const plexRequests = await PlexRequest.findAll({ where: { request: { [Op.iLike]: `%${name}%` } } });
        res.json({ data: plexRequests });
    } catch (error) {
        console.error('Error fetching Plex requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//! Get Plex requests by imdbID
//? Get Plex requests by imdbID
const getPlexRequestsByImdbID = async (req, res) => {
    try {
        const { imdbID } = req.query;
        const plexRequests = await PlexRequest.findAll({ where: { imdbID } });
        res.json({ data: plexRequests });
    } catch (error) {
        console.error('Error fetching Plex requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//! Get all Plex requests
//? Get all Plex requests from the database
const getAllPlexRequests = async (req, res) => {
    try {
        let plexRequests;

        const count = parseInt(req.query.count);

        if (!isNaN(count) && count > 0) {
            plexRequests = await PlexRequest.findAll({
                limit: count,
                order: [['updatedAt', 'DESC']]
            });
        } else {
            plexRequests = await PlexRequest.findAll({
                order: [['updatedAt', 'DESC']]
            });
        }
        
        res.json({ data: plexRequests });
    } catch (error) {
        console.error('Error fetching Plex requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//! Update Plex request status
//? Update the status of a Plex request
const updateStatus = async (req, res) => {
    try {
        const { name } = req.params;
        const { status } = req.body;
        await PlexRequest.update({ status }, { where: { request: name } });
        res.json({ message: 'Plex request status updated successfully' });
    } catch (error) {
        console.error('Error updating Plex request status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//! Delete all plex requests
//? Delete all Plex requests from the database
const deleteAllPlexRequests = async (req, res) => {
    try {
        await PlexRequest.destroy({ where: {} });
        res.json({ message: 'All Plex requests deleted successfully' });
    } catch (error) {
        console.error('Error deleting Plex requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//! Delete plex request by id
//? Delete a single Plex request from the database
const deletePlexRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        await PlexRequest.destroy({ where: { id: requestId } });
        res.json({ message: 'Plex request deleted successfully' });
    } catch (error) {
        console.error('Error deleting Plex request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


module.exports = {
    plexLibrarySearch,
    plexRecentlyAddedWebhook,
    getRecentlyAddedByCount,
    getRecentlyAddedItem,
    deleteRecentlyAddedItem,
    deleteOldRecentlyAdded,
    deleteAllRecentlyAdded,
    addPlexRequest,
    getAllPlexRequests,
    getPlexRequestsByName,
    getPlexRequestsByImdbID,
    updateStatus,
    deleteAllPlexRequests,
    deletePlexRequest,
    getAllRecentlyAddedbyImdbID
};
