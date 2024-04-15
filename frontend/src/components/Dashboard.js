import React, { useEffect, useState, useContext, useRef } from 'react';
import PublicFiles from './PublicFiles';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import UploadForm from './UploadForm';
import UploadFormHTTP from './UploadFormHTTP';
import PrivateFiles from './PrivateFiles';
import { getPublicFiles, getPrivateFiles } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PowerIcon from '@mui/icons-material/Power';
import LanguageIcon from '@mui/icons-material/Language';
import AddIcon from '@mui/icons-material/Add';

const Dashboard = () => {
  const [publicFiles, setPublicFiles] = useState([]);
  const [privateFiles, setPrivateFiles] = useState([]);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showUploadFormHTTP, setShowUploadFormHTTP] = useState(false);
  const [activeTab, setActiveTab] = useState('public');

  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);

  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);
  const uploadFormRef = useRef(null);
  const uploadFormHTTPRef = useRef(null);

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

  useEffect(() => {
    console.log('Effect triggered');
    const handleOutsideClick = (event) => {
      const formRefsValues = [loginFormRef, registerFormRef, uploadFormRef, uploadFormHTTPRef];
      const isAnyFormOpen = showLoginForm || showRegisterForm || showUploadForm || showUploadFormHTTP;
    
      if (isAnyFormOpen) {
        const isClickInsideForm = formRefsValues.some((ref) => {
          return ref.current && (ref.current.contains(event.target) || ref.current === event.target);
        });
    
        if (!isClickInsideForm) {
          setShowLoginForm(false);
          setShowRegisterForm(false);
          setShowUploadForm(false);
          setShowUploadFormHTTP(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showLoginForm, showRegisterForm, showUploadForm, showUploadFormHTTP]);

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
      setPublicFiles(publicFilesResponse);
      if (isLoggedIn) {
        const privateFilesResponse = await getPrivateFiles();
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
    <div className='dashboardContainer'>
      <div className='clouds'>
        <div className='clouds-1'></div>
        <div className='clouds-2'></div>
        <div className='clouds-3'></div>
      </div>
      <div className='lightning'></div>
      <div id='logo'>
        <div className='logo'>
          <img className='logoImg' src='assets/cloud.png' alt="Molex.Cloud"></img>
          Molex.cloud
        </div>
        <div className='navButtons'>
          {!isLoggedIn && (
            <>
              <button className='button' onClick={toggleLoginForm}><LoginIcon /> Login</button>
              <button className='button' onClick={toggleRegisterForm}><AddIcon />Account</button>
            </>
          )}
          {isLoggedIn && <button className='button' onClick={handleLogout}><LogoutIcon /> Logout</button>}
        </div>
      </div>

      <div className='dashButtons'>
        {isLoggedIn && <button className='button' onClick={toggleUploadForm}>Socket Upload<PowerIcon /></button>}
        {isLoggedIn && <button className='button' onClick={toggleUploadFormHTTP}>HTTP Upload<LanguageIcon /> </button>}
      </div>

      {isLoggedIn && showUploadForm && <UploadForm onUploadSuccess={handleUploadSuccess} ref={uploadFormRef} />}
      {isLoggedIn && showUploadFormHTTP && <UploadFormHTTP onUploadSuccess={handleUploadSuccess} ref={uploadFormHTTPRef} />}

      {showLoginForm && <LoginForm onLoginSuccess={handleLoginSuccess} ref={loginFormRef} />}
      {showRegisterForm && <RegisterForm onRegisterSuccess={handleRegisterSuccess} ref={registerFormRef} />}

      <div className='filesContainer'>
        <div className='dashTabs'>
          <button className={`tabButton ${activeTab === 'public' ? 'active' : ''}`} onClick={() => setActiveTab('public')}>
            Public Files
          </button>
          {isLoggedIn && (
            <button className={`tabButton ${activeTab === 'private' ? 'active' : ''}`} onClick={() => setActiveTab('private')}>
              Private Files
            </button>
          )}
        </div>
        <div className='tabsContent'>
          {activeTab === 'public' && <PublicFiles files={publicFiles} />}
          {activeTab === 'private' && isLoggedIn && <PrivateFiles files={privateFiles} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
