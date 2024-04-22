const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const plexController = require('../controllers/plexController');


router.get('/', (req, res) => {
    res.json({ message: 'Plex API' });
});

// https://molex.cloud/api/plex/refresh/?sectionId=5
// https://molex.cloud/api/plex/refresh/?sectionId=8
router.get('/refresh', async (req, res) => {
    plexController.refreshLibrary(req, res);
});

router.get('/proxy', async (req, res) => {
   plexController.proxy(req, res);
});

router.post('/webhook', async (req, res) => {
   plexController.webhook(req, res);
});

router.get('/items', async (req, res) => {
    plexController.getItems(req, res);
});

router.get('/items/:id', async (req, res) => {
    plexController.getItem(req, res);
});

router.delete('/items/:id', async (req, res) => {
    plexController.deleteItem(req, res);
});

router.delete('/items', async (req, res) => {
    plexController.deleteAllItems(req, res);
});

router.delete('/old-items', async (req, res) => {
    plexController.deleteOldItems(req, res);
});

module.exports = router;
