import React, { createContext, useContext, useState } from 'react';

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [globals, setGlobals] = useState({
    file: null,
    filename: null,
    isPrivate: false,
    progress: 0,
    isActive: false,
    sessionId: null,
  });

  return (
    <GlobalContext.Provider value={{ globals, setGlobals }}>
      {children}
    </GlobalContext.Provider>
  );
};
