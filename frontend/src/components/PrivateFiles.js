import React from 'react';
import { downloadFile } from '../services/api';

const PrivateFiles = ({ files }) => {
  if (!files) {
    return <p>Loading...</p>;
  }

  const fileList = files.files || [];

  return (
    <div className='filesContainer'>

      {fileList.length > 0 ? (
        <>
          <div className='filesHeader'>
            <div className='filesHeaderText'>Private Files</div>
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
                  <button className='button' onClick={() => downloadFile(file.id, file.filename)}>Download</button>
                </div>
              </div>

            ))}
          </div>
        </>
      ) : (
        <div className='filesHeader'>
          <div className='filesHeaderText'>Private Files</div>
          <div className='fileTypesContainer'>
            <p>No private files found</p>
          </div>
        </div> 
      )}
    </div>
  );
};

export default PrivateFiles;
