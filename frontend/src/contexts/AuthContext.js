import React, { createContext, useState, useEffect } from 'react';
import { cap } from '../services/helpers';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.userId);
      setUsername(cap(payload.username));
      setRoles(payload.roles);
      setIsLoggedIn(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function isRole(role) {
    return roles.includes(role);
  } 

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userId, setUserId, username, setUsername, isRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
