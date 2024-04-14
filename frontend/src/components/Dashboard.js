import React, { useEffect, useState, useContext } from 'react';
import PublicFiles from './PublicFiles';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import UploadForm from './UploadForm';
import UploadFormHTTP from './UploadFormHTTP';
import PrivateFiles from './PrivateFiles';
import { getPublicFiles, getPrivateFiles } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Dashboard = () => {
  const [publicFiles, setPublicFiles] = useState([]);
  const [privateFiles, setPrivateFiles] = useState([]);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showUploadFormHTTP, setShowUploadFormHTTP] = useState(false);

  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    if (isLoggedIn) {
      getPrivateFiles()
        .then(response => setPrivateFiles(response))
        .catch(error => console.error('Error fetching private files:', error));
    } else {
      setPrivateFiles([]);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    getPublicFiles()
      .then(response => setPublicFiles(response))
      .catch(error => console.error('Error fetching public files:', error));
  }, []);

  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm);
    setShowRegisterForm(false);
  };

  const toggleRegisterForm = () => {
    setShowRegisterForm(!showRegisterForm);
    setShowLoginForm(false);
  };

  const toggleUploadForm = () => {
    setShowUploadForm(!showUploadForm);
    setShowUploadFormHTTP(false);
  };

  const toggleUploadFormHTTP = () => {
    setShowUploadFormHTTP(!showUploadFormHTTP);
    setShowUploadForm(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  const handleLoginSuccess = () => {
    setShowLoginForm(false);
  };

  const handleRegisterSuccess = () => {
    setShowRegisterForm(false);
  };

  const fetchFiles = async () => {
    try {
      const publicFilesResponse = await getPublicFiles();
      console.log(publicFilesResponse);
      setPublicFiles(publicFilesResponse);
      if (isLoggedIn) {
        const privateFilesResponse = await getPrivateFiles();
        console.log(privateFilesResponse);
        setPrivateFiles(privateFilesResponse);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleUploadSuccess = async () => {
    setShowUploadForm(false);
    setShowUploadFormHTTP(false);
    setTimeout(async () => {
      await fetchFiles();
    }, 300);
  };

  return (


    <div>
      <div className='clouds'>
        <div className='clouds-1'></div>
        <div className='clouds-2'></div>
        <div className='clouds-3'></div>
      </div>
      <div className='lightning'></div>
      <div id='logo'>
        <div class='logo'>Molex.cloud</div>
        <div className='navButtons'>
          {!isLoggedIn && (
            <>
              <button className='button' onClick={toggleLoginForm}>Login</button>
              <button className='button' onClick={toggleRegisterForm}>Register</button>
            </>
          )}
          {isLoggedIn && <button className='button' onClick={handleLogout}>Logout</button>}
        </div>
      </div>

      <div className='dashButtons'>
        {isLoggedIn && <button className='button' onClick={toggleUploadForm}>Upload File via Socket</button>}
        {isLoggedIn && <button className='button' onClick={toggleUploadFormHTTP}>Upload File via HTTP</button>}
      </div>
      {isLoggedIn && showUploadForm && <UploadForm onUploadSuccess={handleUploadSuccess} />}
      {isLoggedIn && showUploadFormHTTP && <UploadFormHTTP onUploadSuccess={handleUploadSuccess} />}
      {showLoginForm && <LoginForm onLoginSuccess={handleLoginSuccess} />}
      {showRegisterForm && <RegisterForm onRegisterSuccess={handleRegisterSuccess} />}
      {isLoggedIn && <PrivateFiles files={privateFiles} />}
      <PublicFiles files={publicFiles} />
    </div>
  );
};

export default Dashboard;
