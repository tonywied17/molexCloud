import React, { useState } from 'react';
import { uploadFileChunk } from '../services/api';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleCheckboxChange = (e) => {
    setIsPrivate(e.target.checked);
  };

  const handleUpload = async () => {
    if (!file) {
      console.error('No file selected');
      return;
    }
  
    const chunkSize = 10 * 1024 * 1024; // 10MB
    const totalChunks = Math.ceil(file.size / chunkSize);
  
    for (let i = 1; i <= totalChunks; i++) {
      const start = (i - 1) * chunkSize;
      const end = i * chunkSize;
      const chunk = file.slice(start, end);
      const chunkUrl = URL.createObjectURL(chunk); 
  
      const formData = new FormData();
      formData.append('chunkUrl', chunkUrl); 
      formData.append('originalname', file.name);
      formData.append('totalChunks', totalChunks);
      formData.append('isPrivate', isPrivate);
  
      try {
        console.log(`Uploading chunk ${i}...`);
        const response = await uploadFileChunk(formData);
        console.log(`Chunk ${i} uploaded successfully:`, response);
      } catch (error) {
        console.error(`Error uploading chunk ${i}:`, error);
      }
    }
  };
  
  return (
    <div>
      <h2>Upload File</h2>
      <input type="file" onChange={handleFileChange} />
      <label>
        Is Private:
        <input type="checkbox" checked={isPrivate} onChange={handleCheckboxChange} />
      </label>
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
};

export default UploadForm;
