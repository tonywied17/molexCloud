import React, { useState } from 'react';
import { uploadFileChunk } from '../../../services/api';
import { formatFileSize } from '../../../services/helpers';
import { v4 as uuidv4 } from 'uuid';
import { useGlobalContext } from '../../../contexts/GlobalContext'

const UploadHTTP = ({ onUploadSuccess }) => {

  const { globals, setGlobals } = useGlobalContext();

  const [isPrivate, setIsPrivate] = useState(globals.isPrivate);

  const handleFileChange = (e) => {
    setGlobals(prevGlobals => ({
      ...prevGlobals,
      file: e.target.files[0],
      filename: e.target.files[0].name
    }));
  };


  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setIsPrivate(isChecked);
    setGlobals(prevGlobals => ({
      ...prevGlobals,
      isPrivate: isChecked
    }));
  };

  const handleUpload = async () => {
    if (!globals.file) {
      console.error('No file selected');
      return;
    }
    console.log('Uploading file:', globals.file);

    const chunkSize = 10 * 1024 * 1024; // 10MB
    const totalChunks = Math.ceil(globals.file.size / chunkSize);
    let totalBytesSent = 0;

    const uploadSessionId = uuidv4();
    setGlobals(prevGlobals => ({
      ...prevGlobals,
      sessionId: uploadSessionId,
      isActive: true
    }));

    try {
      for (let i = 1; i <= totalChunks; i++) {
        const start = (i - 1) * chunkSize;
        const end = i * chunkSize;
        const chunk = globals.file.slice(start, end);

        totalBytesSent += chunk.size;
        const progress = Math.round((totalBytesSent / globals.file.size) * 100);
        setGlobals(prevGlobals => ({
          ...prevGlobals,
          progress
        }));

        console.log(`Uploading chunk ${i} of ${totalChunks} (${formatFileSize(chunk.size)}) - ${progress}%`);
        console.log(chunk);

        const formData = new FormData();
        formData.append('chunk', chunk, globals.file.name);
        formData.append('sessionId', uploadSessionId);
        formData.append('originalname', globals.file.name);

        const response = await uploadFileChunk(formData, globals.isPrivate, totalChunks, i);
        // 201 if last chunk 200 if not last chunk (keep going)
        console.log('Upload response:', response);
      }
      setIsPrivate(false);
      setGlobals(prevGlobals => ({
        ...prevGlobals,
        file: null,
        filename: null,
        isPrivate: false,
        progress: 0,
        isActive: false,
        sessionId: null
      }));
      await onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <div>
      <div className='modalTitle'></div>
      <div className='uploadFormFields'>
        {globals.file && (
          <button className='button'>
            {globals.file.name} ({formatFileSize(globals.file.size)})
          </button>
        )}
        <input type="file" onChange={handleFileChange} />
        {globals.progress > 0 && <div>Progress: {globals.progress}%</div>}
      </div>
      <div className='uploadControlsDiv'>
        <label>
          Is Private:
          <input type="checkbox" checked={isPrivate} onChange={handleCheckboxChange} />
        </label>
        <button className='button' style={{ width: '100%' }} onClick={handleUpload}>Upload</button>
      </div>
    </div>
  );
};

export default UploadHTTP;
