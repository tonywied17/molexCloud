import React from 'react';

const PublicFiles = ({ files }) => {
  return (
    <div>
      <h2>Public Files</h2>
      <ul>
        {files.map((file, index) => (
          <li key={index}>{file.filename}</li>
        ))}
      </ul>
    </div>
  );
};

export default PublicFiles;
