import React, { createContext, useState, useEffect } from 'react';
import { cap } from '../services/helpers';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.userId);
      setUsername(cap(payload.username));
      setIsLoggedIn(true);
    }
  }, [ isLoggedIn, userId, username]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userId, setUserId, username, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
