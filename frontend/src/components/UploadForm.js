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
    let start = 0;
  
    for (let i = 1; i <= totalChunks; i++) {
      const chunk = file.slice(start, start + chunkSize);
      const formData = new FormData();
      formData.append('filename', file.name);
      formData.append('chunkNumber', i);
      formData.append('totalChunks', totalChunks);
      formData.append('chunk', chunk);
      formData.append('isPrivate', isPrivate);
  
      try {
        console.log(`Uploading chunk ${i}/${totalChunks}...`);
        const response = await uploadFileChunk(formData);
        console.log(`Chunk ${i}/${totalChunks} uploaded successfully.`, response);
        start += chunkSize;
      } catch (error) {
        console.error('Error uploading file chunk:', error);
        return;
      }
    }
  
    console.log('File uploaded successfully');
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
