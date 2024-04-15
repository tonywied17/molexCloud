import React, { useState } from 'react';
import { uploadFileChunk } from '../services/api';

const UploadFormHTTP = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [progress, setProgress] = useState(0);

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

    console.log(file);
    const chunkSize = 10 * 1024 * 1024; // 10MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    let totalBytesSent = 0;

    console.log('Total chunks:', totalChunks);
    console.log('Is private:', isPrivate);
    console.log('File size:', formatFileSize(file.size));

    for (let i = 1; i <= totalChunks; i++) {
      const start = (i - 1) * chunkSize;
      const end = i * chunkSize;
      const chunk = file.slice(start, end);

      totalBytesSent += chunk.size;
      let progress = Math.round((totalBytesSent / file.size) * 100);
      setProgress(progress);

      const formData = new FormData();
      formData.append('chunk', chunk, file.name);
      formData.append('originalname', file.name);
      console.log('chunk:', chunk);

      try {
        console.log(`Uploading chunk ${i}/${totalChunks}...`);
        const response = await uploadFileChunk(formData, isPrivate, totalChunks, i);
        if (response.status === 201) {
          console.log(`File ${file.name} - ${formatFileSize(file.size)} uploaded in ${totalChunks} chunks`);
          await onUploadSuccess();
        }
      } catch (error) {
        console.error(`Error uploading chunk ${i}:`, error);
      }
    }
  };

  function formatFileSize(bytes) {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    } else if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return bytes + ' bytes';
    }
  }

  return (
    <div>
      <div className='uploadFormDiv'>
      <div className='modalTitle'>HTTP Upload</div>
        <div className='uploadFormFields'>
          
          <input type="file" className='fileInput' onChange={handleFileChange} />
          <button className='button' onClick={() => document.querySelector('input[type="file"]').click()}>Select File</button>
          {progress > 0 && <div>Progress: {progress}%</div>}
        </div>
        <div className='uploadControlsDiv'>
          <label>
            Is Private:
            <input type="checkbox" checked={isPrivate} onChange={handleCheckboxChange} />
          </label>
          <button className='button' style={{width: '100%'}} onClick={handleUpload}>Upload</button>
        </div>
      </div>
    </div>
  );
};

export default UploadFormHTTP;