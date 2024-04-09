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
      setPrivateFiles(response.data);
    } catch (error) {
      console.error('Error fetching private files:', error);
    }
  };

  return (
    <div>
      <h2>Private Files</h2>
      <ul>
        {privateFiles.map((file, index) => (
          <li key={index}>{file.filename}</li>
        ))}
      </ul>
    </div>
  );
};

export default PrivateFiles;
