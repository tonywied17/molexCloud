import React, { useState } from 'react';

const UploadForm = ({ onUploadSuccess }) => {
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
  
    const socket = new WebSocket('wss://molex.cloud:3222');
  
    let totalBytesSent = 0;
  
    socket.onopen = () => {
      const metadata = {
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        isPrivate: isPrivate,
      };
      socket.send(JSON.stringify({ type: 'file_upload_metadata', payload: metadata }));
  
      const reader = new FileReader();
      const chunkSize = 1024 * 1024;
      let offset = 0;
  
      reader.onload = () => {
        const chunk = reader.result;
        socket.send(chunk);
        totalBytesSent += chunk.byteLength;
  
        offset += chunkSize;
        if (offset < file.size) {
          let progress = Math.round((totalBytesSent / file.size) * 100);
          setProgress(progress);
          console.log('Progress:', progress + '%');
          readChunk();
        } else {
          console.log('Total bytes sent:', totalBytesSent);
          console.log('File size:', file.size);
          if (totalBytesSent === file.size) {
            socket.send(JSON.stringify({ type: 'file_upload_end' }));
          }
        }
      };
  
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        if (data.type === 'file_resume') {
          const resumeOffset = parseInt(data.payload);
          console.log('Resuming upload from byte:', resumeOffset);
          totalBytesSent = resumeOffset;
          readChunk(resumeOffset);
        } else if (data.success) {
          socket.close();
        } else if (data.error) {
          console.error('Error:', data.error);
          socket.close();
        }
      };
  
      const readChunk = () => {
        const chunk = file.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(chunk);
      };
  
      readChunk();
    };
  
    socket.onclose = async () => {
      console.log('WebSocket connection closed');
      await onUploadSuccess();
    };
  };
  

  return (
    <div>
      <div className='uploadFormDiv'>
        <div className='modalTitle'>Socket Upload</div>
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
          <button className='button' style={{ width: '100%' }} onClick={handleUpload}>Upload</button>
        </div>
      </div>
    </div>
  );
};

export default UploadForm;
