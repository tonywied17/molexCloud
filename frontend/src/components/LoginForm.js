import React, { useState, useContext, forwardRef } from 'react';
import { loginUser } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const LoginForm = forwardRef(({ onLoginSuccess }, ref) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setIsLoggedIn } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser({ username, password });
      console.log('Login response:', response.token);
      localStorage.setItem('token', response.token);
      setIsLoggedIn(true);
      onLoginSuccess();
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  return (
    <div>
      <div ref={ref} className='authFormContainer'>
        <form className='authFormFields' onSubmit={handleSubmit}>
          <div>Logging back in...</div>
          <div className='inputField'>
            <label>Username:</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className='inputField'>
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className='button' type="submit">Login</button>
        </form>
      </div>
    </div>
  );
});

export default LoginForm;
