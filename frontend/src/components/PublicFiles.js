import React from 'react';

const PublicFiles = ({ files }) => {
  return (
    <div>
      <h2>Public Files</h2>
      {files.length > 0 ? (
        <ul>
          {files.map((file, index) => (
            <li key={index}>{file.filename}</li>
          ))}
        </ul>
      ) : (
        <p>No public files found</p>
      )}
    </div>
  );
};

export default PublicFiles;
