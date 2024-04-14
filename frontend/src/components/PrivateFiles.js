import React from 'react';
import { downloadFile } from '../services/api';

const PrivateFiles = ({ files }) => {
  if (!files) {
    return <p>Loading...</p>;
  }

  const fileList = files.files || [];

  return (
    <div className='filesContainer'>
      <h2>Private Files</h2>

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
                  <button onClick={() => downloadFile(file.id, file.filename)}>Download</button>
                </div>
              </div>

            ))}
          </div>
        </>
      ) : (
        <p>No private files found</p>
      )}
    </div>
  );
};

export default PrivateFiles;
