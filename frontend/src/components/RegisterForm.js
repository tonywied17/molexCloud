import React, { useState, useContext, forwardRef } from 'react';
import { registerUser, } from '../services/api';
import { AuthContext } from '../contexts/AuthContext'; 

const RegisterForm = forwardRef(({ onRegisterSuccess }, ref) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
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

  return (
    <div>
      <div ref={ref} className='authFormContainer'>
        <form className='authFormFields' onSubmit={handleSubmit}>
          <div>Create an account...</div>
          <div className='inputField'>
            <label>Username:</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className='inputField'>
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className='inputField'>
            <label>Invite Code:</label>
            <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
          </div>
          <button className='button' type="submit">Register</button>
        </form>
      </div>
    </div>
  );
});

export default RegisterForm;
