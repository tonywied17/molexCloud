const { PlexItem } = require('../models');
const axios = require('axios');
require('dotenv').config();
const { Op } = require('sequelize');

const plexApi = axios.create({
    baseURL: 'http://71.224.160.213:8222/api/v2',
    params: {
        apikey: process.env.PLEX_API_KEY
    }
});

const proxy = async (req, res) => {
    try {
        const { sectionId, title } = req.query;
        const response = await plexApi.get(`/?cmd=get_library_media_info&section_id=${sectionId}&search=${title}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const refreshLibrary = async (req, res) => {
    try {
        const { sectionId } = req.query;
        const response = await plexApi.get(`/?cmd=get_library_media_info&section_id=${sectionId}&refresh=true`);
        console.log('Plex Library Refreshed!');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const webhook = async (req, res) => {
    console.log(req.body.data);
    try {
        const {
            media_type,
            title,
            release_year,
            poster_url,
            plot,
            genre,
            directors,
            actors,
            runtime,
            imdbRating,
            plexRating,
            plex_library_url
        } = req.body.data;

        const plexItem = await PlexItem.create({
            media_type,
            title,
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
        res.status(201).json({ message: 'Plex item saved successfully', data: plexItem, showsRefreshData, moviesRefreshData });
    } catch (error) {
        console.error('Error saving Plex item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const refreshPlexLibraries = async (title) => {
    try {
        const refreshShows = plexApi.get('/?cmd=get_library_media_info&section_id=5&search=' + title + '&refresh=true');
        const refreshMovies = plexApi.get('/?cmd=get_library_media_info&section_id=8&search=' + title + '&refresh=true');
        
        const [showsResponse, moviesResponse] = await Promise.all([refreshShows, refreshMovies]);
        return [showsResponse.data, moviesResponse.data];
    } catch (error) {
        console.error('Error refreshing Plex libraries:', error);
        throw error;
    }
};

const getItems = async (req, res) => {
    try {
        const plexItems = await PlexItem.findAll();

        res.json({ data: plexItems });
    } catch (error) {
        console.error('Error fetching Plex items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getItem = async (req, res) => {
    try {
        let id = req.query.id;
        const plexItem = await PlexItem.findOne({ where: { id } });
        res.json({ data: plexItem });
    } catch (error) {
        console.error('Error fetching Plex item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const deleteItem = async (req, res) => {
    try {
        let id = req.query.id;
        await PlexItem.destroy({ where: { id } });
        res.json({ message: 'All Plex item deleted successfully' });
    } catch (error) {
        console.error('Error deleting Plex items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const deleteOldItems = async () => {
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

const deleteAllItems = async (req, res) => {
    try {
        await PlexItem.destroy({ where: {} });
        res.json({ message: 'All Plex item deleted successfully' });
    } catch (error) {
        console.error('Error deleting Plex items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


module.exports = {
    proxy,
    webhook,
    getItems,
    getItem,
    deleteItem,
    deleteOldItems,
    deleteAllItems,
    refreshLibrary
};
