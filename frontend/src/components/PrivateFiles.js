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
            <div>
              <input type='text' value={files.search} placeholder='Search...' />  
            </div>
            <div className='fileTypesContainer'>
              {Object.entries(files.fileTypeCounts).map(([fileType, count]) => (
                <div key={fileType}>
                  <b>{fileType}:</b> {count}
                </div>
              ))}
            </div>

          </div>
          <div className='fileGrid'>

            {fileList.map((file, index) => (

              <div className='fileDetailsBox' key={index}>
                <div className='fileDetailsContainer'>
                  <div>{file.filename}</div>
                  <div>{file.fileType}</div>
                </div>
                

                <div className='fileButtonsContainer'>
                  <button className='button' onClick={() => downloadFile(file.id, file.filename)}>Download</button>
                </div>
              </div>

            ))}
          </div>
        </>
      ) : (
        <div className='filesHeader'>
          <div className='fileTypesContainer'>
            <p>No private files found</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateFiles;
