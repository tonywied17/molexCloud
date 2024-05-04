import React, { useState, useContext, forwardRef } from 'react';
import { loginUser } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

const LoginForm = forwardRef(({ onLoginSuccess }, ref) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setIsLoggedIn, setUserId, setUsername: setAuthUsername, setRoles } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser({ username, password });
      localStorage.setItem('token', response.token);
      setIsLoggedIn(true);
      setUserId(response.userId);
      setAuthUsername(response.username);
      setRoles(response.roles || []); 
      onLoginSuccess();
    } catch (error) {
      let errorMessage = error.response.data.error;
      if (error.response.status === 401) {
        alert(errorMessage);
      }
      console.error('Error logging in:', error);
    }
  };

  return (
    <div>
      <div ref={ref} className='authFormContainer'>
        <form className='authFormFields' onSubmit={handleSubmit}>
        <div className='formHeader'>Logging back in...</div>
          <div className='formContainer'>
          <div className='inputField'>
            <label>Username:</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className='inputField'>
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className='formButtons'>
            <button className='button' type="submit">Login</button>
            </div>  
          </div>
        </form>
      </div>
    </div>
  );
});

export default LoginForm;
