/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\controllers\utils\helpers.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Monday April 22nd 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon April 22nd 2024 10:47:20 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const fs = require('fs');
const recursive = require('recursive-readdir');
const path = require('path');

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

module.exports = {
    calculateDirectorySize,
    addDirectoryToArchive
};
