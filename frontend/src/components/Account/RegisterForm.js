import React, { useState, useContext, forwardRef } from 'react';
import { registerUser, } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

const RegisterForm = forwardRef(({ onRegisterSuccess }, ref) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('pib');
  const { setIsLoggedIn } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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

  const rand = () => Math.random().toString(36).substr(2, 7);

  return (
    <div>
      <div ref={ref} className='authFormContainer'>
        <form className='authFormFields' onSubmit={handleSubmit}>
          <div className='formHeader'>Create an account...<div>Registration: <span>Open</span></div></div>
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
              <input type="text" style={{ 'opacity': '0.8', 'color': '#6bc28ce0' }} value={rand()} onChange={(e) => setInviteCode(e.target.value)} disabled />
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
