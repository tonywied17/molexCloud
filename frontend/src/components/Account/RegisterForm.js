import React, { useState, useContext, forwardRef, useEffect } from 'react';
import { registerUser } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

const RegisterForm = forwardRef(({ onRegisterSuccess }, ref) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [fakeCode, setFakeCode] = useState('');
  const { setIsLoggedIn } = useContext(AuthContext);
  const [openRegistration, setOpenRegistration] = useState(true);

  useEffect(() => {
    const generateInviteCode = () => {
      const randomCode = Math.random().toString(36).substr(2, 7);
      setFakeCode(randomCode);
    };
  
    console.log('openRegistration:', openRegistration);
    if(openRegistration) {
      generateInviteCode();
      setInviteCode('pib');
    } else {
      setInviteCode('');
    }
  
  }, [openRegistration]); // Add openRegistration to the dependency array
  


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('openRegistration:', openRegistration);

      console.log('inviteCode:', inviteCode);
      const response = await registerUser({ username, password, inviteCode });
      localStorage.setItem('token', response.token);
      setIsLoggedIn(true);
      alert('User registered successfully');
      onRegisterSuccess();


    } catch (error) {
      let errorMessage = error.response.data.error;
      if (error.response.status === 401) {
        alert(errorMessage);
      }
      console.error('Error registering user:', error);
    }
  };

  return (
    <div>
      <div ref={ref} className='authFormContainer'>
        <form className='authFormFields' onSubmit={handleSubmit}>
          <div className='formHeader'>Create an account...
            <div>Registration: <span className={`${openRegistration ? 'openReg' : 'closedReg'}`}>{openRegistration ? 'Open' : 'Invite Only'}</span></div>
          </div>
          <div className='formContainer'>
            <div className='inputField'>
              <label>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className='inputField'>
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className='inputField'>
              <label>Invite Code:</label>

              {openRegistration && <input type="text" style={{ 'opacity': '0.8', 'color': '#6bc28ce0' }} value={fakeCode} disabled />}
              {!openRegistration && <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />}

            </div>
            <div className='formButtons'>
              <button className='button' type="submit">Register</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

export default RegisterForm;
