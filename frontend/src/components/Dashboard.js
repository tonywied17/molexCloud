import React, { useEffect, useState, useContext } from 'react';
import PublicFiles from './PublicFiles';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import PrivateFiles from './PrivateFiles';
import { getPublicFiles, getPrivateFiles } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Dashboard = () => {
  const [publicFiles, setPublicFiles] = useState([]);
  const [privateFiles, setPrivateFiles] = useState([]);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    fetchPublicFiles();
    if (isLoggedIn) {
      fetchPrivateFiles();
    }
  }, [isLoggedIn]);

  const fetchPublicFiles = async () => {
    try {
      const response = await getPublicFiles();
      setPublicFiles(response.data);
    } catch (error) {
      console.error('Error fetching public files:', error);
    }
  };

  const fetchPrivateFiles = async () => {
    try {
      const response = await getPrivateFiles();
      setPrivateFiles(response.data);
    } catch (error) {
      console.error('Error fetching private files:', error);
    }
  };

  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm);
    setShowRegisterForm(false);
  };

  const toggleRegisterForm = () => {
    setShowRegisterForm(!showRegisterForm);
    setShowLoginForm(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <div>
      <h1>Dashboard</h1>
      {!isLoggedIn && (
        <>
          <button onClick={toggleLoginForm}>Login</button>
          <button onClick={toggleRegisterForm}>Register</button>
        </>
      )}
      {isLoggedIn && <button onClick={handleLogout}>Logout</button>}
      {showLoginForm && <LoginForm />}
      {showRegisterForm && <RegisterForm />}
      {isLoggedIn && <PrivateFiles files={privateFiles} />}
      <PublicFiles files={publicFiles} />
    </div>
  );
};

export default Dashboard;
