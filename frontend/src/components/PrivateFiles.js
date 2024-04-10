import React, { useEffect, useState } from 'react';
import { getPrivateFiles } from '../services/api';

const PrivateFiles = () => {
  const [privateFiles, setPrivateFiles] = useState([]);

  useEffect(() => {
    fetchPrivateFiles();
  }, []);

  const fetchPrivateFiles = async () => {
    try {
      const response = await getPrivateFiles();
      setPrivateFiles(response);
    } catch (error) {
      console.error('Error fetching private files:', error);
    }
  };

  return (
    <div>
      <h2>Private Files</h2>
      {privateFiles.length > 0 ? (
        <ul>
          {privateFiles.map((file, index) => (
            <li key={index}>{file.filename}</li>
          ))}
        </ul>
      ) : (
        <p>No private files found</p>
      )}
    </div>
  );
};

export default PrivateFiles;
