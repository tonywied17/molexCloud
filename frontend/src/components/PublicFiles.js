import React from 'react';

const PublicFiles = ({ files }) => {
  if (!files) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h2>Public Files</h2>
      {files.length > 0 ? (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
          {files.map((file, index) => (

              <div key={index} style={{ border: '1px solid #000', display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '70vw' }}>
                {file.filename}
                <b>{file.fileType}</b>
                <i>{file.path}</i>
              </div>
             
          ))}
        </div>
      ) : (
        <p>No public files found</p>
      )}
    </div>
  );
};

export default PublicFiles;
