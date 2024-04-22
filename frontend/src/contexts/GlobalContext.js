import React, { createContext, useContext, useState } from 'react';

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [uploadGlobals, setUploadGlobals] = useState({
    file: null,
    filename: null,
    isPrivate: false,
    progress: 0,
    isActive: false,
    fileType: null,
    sessionId: null,
  });

  return (
    <GlobalContext.Provider value={{ uploadGlobals, setUploadGlobals }}>
      {children}
    </GlobalContext.Provider>
  );
};
