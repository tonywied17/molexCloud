import React, { useState, useContext, forwardRef, useEffect } from 'react';
import { registerUser } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

const RegisterForm = forwardRef(({ onRegisterSuccess }, ref) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const { setIsLoggedIn } = useContext(AuthContext);

  // Function to generate a random invite code once during component initialization
  useEffect(() => {
    const generateInviteCode = () => {
      const randomCode = Math.random().toString(36).substr(2, 7); // Generate a random code
      setInviteCode(randomCode); // Set the generated code as the invite code state
    };

    generateInviteCode(); // Call the function to generate the invite code once during initialization
  }, []);

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
              <input type="text" style={{ 'opacity': '0.8', 'color': '#6bc28ce0' }} value={inviteCode} disabled />
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
