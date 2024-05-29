/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\controllers\utils\helpers.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Monday April 22nd 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Thu May 23rd 2024 12:13:13 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const fs = require('fs');
const recursive = require('recursive-readdir');
const path = require('path');
const axios = require('axios');

//! Helper function to calculate the size of a directory
async function calculateDirectorySize(dirPath) {
    let totalSize = 0;
    const files = await recursive(dirPath);
    for (const file of files) {
        totalSize += fs.statSync(file).size;
    }
    return totalSize;
}

//! Helper function to add a directory to a zip archive
async function addDirectoryToArchive(archive, dirPath, relativePath) {
    const files = await recursive(dirPath);
    files.forEach((file) => {
        archive.file(file, { name: path.join(relativePath, path.relative(dirPath, file)) });
    });
}

//! Helper function to get the Steam ID from a Steam profile URL
async function getSteamId(req, res) {
    const steamApiKey = process.env.STEAM_API_KEY;
    const profileUrl = req.query.profileUrl;

    if (!profileUrl) {
        return res.status(400).send({ error: 'Profile URL is required' });
    }

    const steamIdMatch = profileUrl.match(/\/id\/([^/]+)|\/profiles\/(\d+)/);
    if (!steamIdMatch) {
        return res.status(400).json({ error: "Invalid Steam profile URL" });
    }

    const vanityName = steamIdMatch[1];
    const steamId = steamIdMatch[2];

    console.log("Extracted Steam ID or Vanity Name:", vanityName || steamId);

    try {
        let resolvedSteamId64;

        if (vanityName) {
            const resolveResponse = await axios.get(
                `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${steamApiKey}&vanityurl=${vanityName}`
            );
            const resolveData = resolveResponse.data;

            if (resolveData.response && resolveData.response.success === 1) {
                resolvedSteamId64 = BigInt(resolveData.response.steamid);
            } else {
                return res
                    .status(400)
                    .json({
                        error: "Error fetching Steam ID. Please check the URL or try again later.",
                    });
            }
        } else if (steamId) {
            resolvedSteamId64 = BigInt(steamId);
        }

        const steamIdY = resolvedSteamId64 % 2n;
        const steamIdZ = (resolvedSteamId64 >> 1n) % (1n << 31n);
        const steamIdUniverse = (resolvedSteamId64 >> 32n) & 0xffn;

        const responseJson = {
            SteamID: `STEAM_${steamIdUniverse}:${steamIdY}:${steamIdZ}`,
            SteamID_3: `[U:1:${steamIdZ * 2n + steamIdY}]`,
            SteamID_64: resolvedSteamId64.toString(),
            ProfileID_URL: `https://steamcommunity.com/profiles/${resolvedSteamId64}`,
        };

        return res.header('Content-Type', 'application/json').send(JSON.stringify(responseJson, null, 2));
    } catch (error) {
        console.error("Error fetching data from Steam API:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    getSteamId,
    calculateDirectorySize,
    addDirectoryToArchive
};
