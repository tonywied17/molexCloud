import React, { useState } from 'react';
import { downloadFile } from '../services/api';

const PublicFiles = ({ files }) => {
  const [searchText, setSearchText] = useState('');

  if (!files) {
    return <p>Loading...</p>;
  }

  const fileList = files.files || [];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  const filteredFiles = fileList.filter((file) =>
    file.filename.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  return (
    <div className='filesContainer'>
      {fileList.length > 0 ? (
        <>
          <div className='filesHeader'>
            <div>
              <input
                type='text'
                value={searchText}
                placeholder='Search...'
                onChange={handleSearchChange}
              />
            </div>
            <div className='fileTypesContainer'>
              {Object.entries(files.fileTypeCounts).map(([fileType, count], index, array) => (
                <div className='fileTypesText' key={fileType}>
                  <span>{fileType}</span> <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className='fileGrid'>
            {filteredFiles.map((file, index) => (
              <div className='fileDetailsBox' key={index}>
                <div className='fileDetailsContainer'>
                  <div>{file.filename}</div>
                  <div>{file.fileType}</div>
                </div>
                <div className='fileButtonsContainer'>
                  <button
                    className='button'
                    onClick={() => copyToClipboard('https://molex.cloud/api/files/download/' + file.id)}
                  >
                    Copy Share Link
                  </button>
                  <button className='button' onClick={() => downloadFile(file.id, file.filename)}>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className='filesHeader'>
          <div className='fileTypesContainer'>
            <p>No public files found</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicFiles;
