import React, { useState } from 'react';
import { uploadFileChunk } from '../../../services/api';
import { formatFileSize } from '../../../services/helpers';
import { v4 as uuidv4 } from 'uuid';
import { useGlobalContext } from '../../../contexts/GlobalContext'

const UploadHTTP = ({ onUploadSuccess }) => {

  const { uploadGlobals, setUploadGlobals } = useGlobalContext();

  const [isPrivate, setIsPrivate] = useState(uploadGlobals.isPrivate);

  const handleFileChange = (e) => {
    setUploadGlobals(prevGlobals => ({
      ...prevGlobals,
      file: e.target.files[0],
      filename: e.target.files[0].name,
      fileType: e.target.files[0].type
    }));
  };


  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setIsPrivate(isChecked);
    setUploadGlobals(prevGlobals => ({
      ...prevGlobals,
      isPrivate: isChecked
    }));
  };

  const handleUpload = async () => {
    if (!uploadGlobals.file) {
      console.error('No file selected');
      return;
    }
    console.log('Uploading file:', uploadGlobals.file);

    const chunkSize = 10 * 1024 * 1024; // 10MB
    const totalChunks = Math.ceil(uploadGlobals.file.size / chunkSize);
    let totalBytesSent = 0;

    const uploadSessionId = uuidv4();
    setUploadGlobals(prevGlobals => ({
      ...prevGlobals,
      sessionId: uploadSessionId,
      isActive: true
    }));

    try {
      for (let i = 1; i <= totalChunks; i++) {
        const start = (i - 1) * chunkSize;
        const end = i * chunkSize;
        const chunk = uploadGlobals.file.slice(start, end);

        totalBytesSent += chunk.size;
        const progress = Math.round((totalBytesSent / uploadGlobals.file.size) * 100);
        setUploadGlobals(prevGlobals => ({
          ...prevGlobals,
          progress
        }));

        console.log(`Uploading chunk ${i} of ${totalChunks} (${formatFileSize(chunk.size)}) - ${progress}%`);
        console.log(chunk);

        const formData = new FormData();
        formData.append('chunk', chunk, uploadGlobals.file.name);
        formData.append('sessionId', uploadSessionId);
        formData.append('fileType', uploadGlobals.fileType);
        formData.append('originalname', uploadGlobals.file.name);

        const response = await uploadFileChunk(formData, uploadGlobals.isPrivate, totalChunks, i);
        // 201 if last chunk 200 if not last chunk (keep going)
        console.log('Upload response:', response);
      }
      setIsPrivate(false);
      setUploadGlobals(prevGlobals => ({
        ...prevGlobals,
        file: null,
        filename: null,
        isPrivate: false,
        progress: 0,
        isActive: false,
        fileType: null,
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
        {uploadGlobals.file && (
          <button className='button'>
            {uploadGlobals.file.name} ({formatFileSize(uploadGlobals.file.size)})
          </button>
        )}
        <input type="file" onChange={handleFileChange} />
        {uploadGlobals.progress > 0 && <div>Progress: {uploadGlobals.progress}%</div>}
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
