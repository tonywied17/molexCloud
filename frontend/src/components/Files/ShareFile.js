import React, { forwardRef, useState } from 'react';
import UploadHTTP from './UploadForms/UploadHTTP';
import UploadSocket from './UploadForms/UploadSocket';

const ShareFile = forwardRef(({ onUploadSuccess }, ref) => {
  const [selectedShareTab, setSelectedShareTab] = useState('http');

 

  const handleShareTabChange = (tab) => {
    setSelectedShareTab(tab);
  };

  return (
    <div ref={ref} className='uploadFormDiv'>
      <div className="tab-buttons">
       {/* <button onClick={() => handleShareTabChange('socket')} className={selectedShareTab === 'socket' ? 'active button' : 'button'}>Socket Upload</button> */}
       {/* <button onClick={() => handleShareTabChange('http')} className={selectedShareTab === 'http' ? 'active button' : 'button'}>HTTP Upload</button> */}
      </div>
      {/* {selectedShareTab === 'socket' && <UploadSocket onUploadSuccess={onUploadSuccess} onUploadActive={onUploadActive} />} */}
      {selectedShareTab === 'http' && (
        <UploadHTTP 
        onUploadSuccess={onUploadSuccess} 
        />
      )}

    </div>
  );
});

export default ShareFile;
