import React from 'react';
import { downloadFile } from '../services/api';

const PublicFiles = ({ files }) => {
  if (!files) {
    return <p>Loading...</p>;
  }

  const fileList = files.files || [];
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  return (
    <div className='filesContainer'>

      {fileList.length > 0 ? (
        <>
          <div className='filesHeader'>
            <div className='filesHeaderText'>Public Files</div>
            <div className='fileTypesContainer'>
              {Object.entries(files.fileTypeCounts).map(([fileType, count]) => (
                <div key={fileType}>
                  <b>{fileType}:</b> {count}
                </div>
              ))}
            </div>

          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            {fileList.map((file, index) => (

              <div className='fileDetailsBox' key={index}>
                [id: {file.id}] - {file.filename}
                <b>{file.fileType}</b>
                <i>{file.path}</i>
                <div className='fileButtonsContainer'>
                  <button className='button' onClick={() => copyToClipboard('http://localhost:3222/api/files/download/' + file.id)}>Copy Share Link</button>
                  <button className='button' onClick={() => downloadFile(file.id, file.filename)}>Download</button>
                </div>
              </div>

            ))}
          </div>
        </>
      ) : (
        <div className='filesHeader'>
          <div className='filesHeaderText'>Public Files</div>
          <div className='fileTypesContainer'>
            <p>No public files found</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicFiles;
