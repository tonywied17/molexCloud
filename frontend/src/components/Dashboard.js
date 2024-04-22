import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { useGlobalContext } from '../contexts/GlobalContext';

// Account Related
import { AuthContext } from '../contexts/AuthContext';
import RegisterForm from './Account/RegisterForm';
import LoginForm from './Account/LoginForm';
import InviteCodeForm from './Account/InviteCodeForm';

// Upload Related
import ShareFile from './Files/ShareFile';

// File Related
import { getAllFiles } from '../services/api';
import PublicFiles from './Files/FileLists/PublicFiles';
import UserFiles from './Files/FileLists/UserFiles';

// Plex Related
import PlexRequests from './Plex/PlexRequests';

// Icons
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import AddIcon from '@mui/icons-material/Add';
import KeyIcon from '@mui/icons-material/Key';
import LoopIcon from '@mui/icons-material/Loop';

const Dashboard = () => {
  const [files, setFiles] = useState({
    publicFiles: {
      files: [],
      fileTypeCounts: {}
    },
    privateFiles: {
      files: [],
      fileTypeCounts: {}
    },
    userFiles: {
      files: [],
      fileTypeCounts: {}
    }
  });

  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showShareFile, setShowShareFile] = useState(false);
  const [showInviteCodeForm, setShowInviteCodeForm] = useState(false);
  const [activeTab, setActiveTab] = useState('public');
  const [uploadProgress, setUploadProgress] = useState(0);
  const { uploadGlobals, setUploadGlobals } = useGlobalContext();
  const { isLoggedIn, setIsLoggedIn, userId, setUserId, username, setUsername } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);
  const shareFileRef = useRef(null);
  const inviteCodeFormRef = useRef(null);

  useEffect(() => {
    const { pathname } = location;

    if (pathname == '/files') {
      setActiveTab('public');
    } else if (pathname.startsWith('/files/users')) {
      setActiveTab('users');
    } else if (pathname.startsWith('/plex')) {
      setActiveTab('plex');
    } else {
      setActiveTab('public');
    }
  }, [location]);

  const handleTabClick = (tab) => {
    if (tab === 'public') {
      navigate('/files');
    } else if (tab === 'users') {
      navigate('/files/users');
    } else if (tab === 'plex') {
      navigate('/plex');
    }
  };

  useEffect(() => {

    getAllFiles()
      .then(response => {
        if (!isLoggedIn) {
          const fileData = {
            publicFiles: {
              files: response.publicFiles ? response.publicFiles : [],
              fileTypeCounts: response.publicFileTypeCounts ? response.publicFileTypeCounts : {}
            }
          };
          setFiles(fileData);
        } else {
          const fileData = {
            publicFiles: {
              files: response.publicFiles ? response.publicFiles : [],
              fileTypeCounts: response.publicFileTypeCounts ? response.publicFileTypeCounts : {}
            },
            privateFiles: {
              files: response.privateFiles ? response.privateFiles : [],
              fileTypeCounts: response.privateFileTypeCounts ? response.privateFileTypeCounts : {}
            },
            userFiles: {
              files: response.userFiles ? response.userFiles : [],
              fileTypeCounts: response.userFileTypeCounts ? response.userFileTypeCounts : {}
            }
          };
          setFiles(fileData);
        }

      })
      .catch(error => console.error('Error fetching files:', error));

  }, [isLoggedIn]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const formRefsValues = [loginFormRef, registerFormRef, shareFileRef, inviteCodeFormRef];
      const isAnyFormOpen = showLoginForm || showRegisterForm || showShareFile || showInviteCodeForm;

      if (isAnyFormOpen) {
        const isClickInsideForm = formRefsValues.some((ref) => {
          return ref.current && (ref.current.contains(event.target) || ref.current === event.target);
        });

        if (!isClickInsideForm) {
          setShowLoginForm(false);
          setShowRegisterForm(false);
          setShowShareFile(false);
          setShowInviteCodeForm(false);
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showLoginForm, showRegisterForm, showShareFile, showInviteCodeForm]);

  useEffect(() => {
    setUploadProgress(uploadGlobals.progress);
  }, [uploadGlobals.progress]);

  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm);
    setShowRegisterForm(false);
  };

  const toggleRegisterForm = () => {
    setShowRegisterForm(!showRegisterForm);
    setShowLoginForm(false);
  };

  const toggleUploadForm = () => {
    setShowShareFile(!showShareFile);
    setShowInviteCodeForm(false);
  };

  const toggleInviteCodeForm = () => {
    setShowInviteCodeForm(!showInviteCodeForm);
    setShowShareFile(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserId(null);
    setIsLoggedIn(false);
  };

  const handleLoginSuccess = () => {
    setShowLoginForm(false);
    fetchFiles();
  };

  const handleRegisterSuccess = () => {
    setShowRegisterForm(false);
  };

  const fetchFiles = async () => {
    try {
      const response = await getAllFiles();
      const filesData = {
        publicFiles: {
          files: response.publicFiles ? response.publicFiles : [],
          fileTypeCounts: response.publicFileTypeCounts ? response.publicFileTypeCounts : {}
        },
        privateFiles: {
          files: response.privateFiles ? response.privateFiles : [],
          fileTypeCounts: response.privateFileTypeCounts ? response.privateFileTypeCounts : {}
        },
        userFiles: {
          files: response.userFiles ? response.userFiles : [],
          fileTypeCounts: response.userFileTypeCounts ? response.userFileTypeCounts : {}
        }
      };
      setFiles(filesData);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };


  const handleUploadSuccess = async () => {
    setUploadProgress(0);
    if (showShareFile) {
      setShowShareFile(false);
    }
    setTimeout(async () => {
      await fetchFiles();
    }, 300);
  };

  const handleDeleteSuccess = async () => {

    await fetchFiles();
  };

  const handleDownloadSuccess = async () => {
    await fetchFiles();
  };

  const handlePlexRequestSuccess = async (result) => {
    console.log(result)
  };

  const handleLogoClick = () => {
    fetchFiles();
    setActiveTab('public');
    navigate('/');
  };

  return (
    <div className='dashboardContainer'>
      <div className='clouds'>
        <div className='clouds-1'></div>
        <div className='clouds-2'></div>
        <div className='clouds-3'></div>
      </div>

      <div id='logo'>

        <div className='logo' onClick={handleLogoClick}>
          {/* <img className='logoImg' src='assets/cloud.png' alt="Molex.Cloud"></img> */}
          {/* Molex.Cloud */}
          <div className="bounce">
            <span className="letter">M</span>
            <span className="letter">o</span>
            <span className="letter">l</span>
            <span className="letter">e</span>
            <span className="letter">x</span>
            <span className="letter">.</span>
            <span className="letter">C</span>
            <span className="letter">l</span>
            <span className="letter">o</span>
            <span className="letter">u</span>
            <span className="letter">d</span>
          </div>
        </div>
        <div className='navButtons'>
          {!isLoggedIn && (
            <>
              <button className='button' onClick={toggleLoginForm}><LoginIcon /> Login</button>
              <button className='button' onClick={toggleRegisterForm}><AddIcon />Account</button>
            </>
          )}
          {isLoggedIn && <button className='button' onClick={toggleInviteCodeForm}><KeyIcon /> Invites</button>}
          {isLoggedIn && <button className='button' onClick={handleLogout}><LogoutIcon /> Logout</button>}
        </div>
      </div>

      <div className='dashButtons'>
        {isLoggedIn && (
          <button className='button' onClick={toggleUploadForm}>
            {uploadGlobals.isActive ? `${uploadGlobals.filename} - ${uploadProgress}%` : 'Upload File'}
            {uploadGlobals.isActive ? <LoopIcon /> : <AddIcon />}
          </button>
        )}
      </div>

      {isLoggedIn && showShareFile && (
        <ShareFile
          ref={shareFileRef}
          uploadGlobals={uploadGlobals}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
      {isLoggedIn && showInviteCodeForm && <InviteCodeForm ref={inviteCodeFormRef} />}
      {showLoginForm && <LoginForm onLoginSuccess={handleLoginSuccess} ref={loginFormRef} />}
      {showRegisterForm && <RegisterForm onRegisterSuccess={handleRegisterSuccess} ref={registerFormRef} />}

      <div className='categories'>
        {/* Files Container */}
        <div className='filesContainer'>
          <div className='dashTabs'>
            <button
              className={`tabButton ${activeTab === 'public' ? 'active' : ''}`}
              onClick={() => handleTabClick('public')}
            >
              Public Cloud
            </button>
            {isLoggedIn && (
              <>
                <button
                  className={`tabButton ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => handleTabClick('users')}
                >
                  {username}'s Uploads
                </button>
              </>
            )}
            <button
              className={`tabButton plexTab ${activeTab === 'plex' ? 'active' : ''}`}
              onClick={() => handleTabClick('plex')}
            >
              Plex Requests
            </button>
          </div>
          <div className='tabsContent'>
            <Routes>
              <Route path="/" element={<PublicFiles files={files.publicFiles} onDeleteSuccess={handleDeleteSuccess} onDownloadSuccess={handleDownloadSuccess} />} />
              <Route path="/files" element={<PublicFiles files={files.publicFiles} onDownloadSuccess={handleDownloadSuccess} />} />
              <Route path="/files/users" element={<UserFiles files={files.userFiles} onDeleteSuccess={handleDeleteSuccess} onDownloadSuccess={handleDownloadSuccess} />} />
              <Route path="/plex" element={<PlexRequests onRequestSuccess={handlePlexRequestSuccess} />} />
              <Route path="/plex/*" element={<PlexRequests onRequestSuccess={handlePlexRequestSuccess} />} />
            </Routes>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
