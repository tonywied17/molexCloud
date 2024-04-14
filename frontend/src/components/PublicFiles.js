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
      <h2>Public Files</h2>

      {fileList.length > 0 ? (
        <>
          <div style={{ marginBottom: '1em' }}>
            {Object.entries(files.fileTypeCounts).map(([fileType, count]) => (
              <div key={fileType}>
                <b>{fileType}:</b> {count}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
            {fileList.map((file, index) => (

              <div key={index} style={{ border: '1px solid #000', display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '70vw', padding: '5px'  }}>
                [id: {file.id}] - {file.filename}
                <b>{file.fileType}</b>
                <i>{file.path}</i>
                <div className='fileButtonsContainer'>
                  <button onClick={() => copyToClipboard('http://localhost:3222/api/files/download/' + file.id)}>Copy Share Link</button>
                  <button onClick={() => downloadFile(file.id, file.filename)}>Download</button>
                </div>
              </div>

            ))}
          </div>
        </>
      ) : (
        <p>No public files found</p>
      )}
    </div>
  );
};

export default PublicFiles;
