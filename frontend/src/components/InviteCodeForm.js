import React, { useState, useEffect, forwardRef } from 'react';
import { generateInviteCode, getUserInviteCodes, deleteUserInviteCode } from '../services/api';

const InviteCodeForm = forwardRef(({ onInviteCodeGenerated }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [userInviteCodes, setUserInviteCodes] = useState([]);

  useEffect(() => {
    fetchUserInviteCodes();
  }, []);

  const fetchUserInviteCodes = async () => {
    try {
      const codes = await getUserInviteCodes();
      setUserInviteCodes(codes);
    } catch (error) {
      console.error('Error fetching user invite codes:', error);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setIsLoading(true);
      const code = await generateInviteCode();
      setGeneratedCode(code);
      setIsLoading(false);

      fetchUserInviteCodes();
    } catch (error) {
      console.error('Error generating invite code:', error);
      setIsLoading(false);
    }
  };


  return (
    <div ref={ref} className='authFormContainer'>
      <form className='authFormFields' onSubmit={(e) => e.preventDefault()}>
        <div>Generated Invite Code:</div>
        <div className='inputField'>
          <input type="text" value={generatedCode} readOnly />
        </div>
        <div className='inputField'>
          <button className='button' onClick={handleGenerateCode} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Code'}
          </button>
        </div>
        {userInviteCodes.length ? (
          <div className='myCodesContainer'>
            <div style={{margin: '0.5em 0', fontSize: '1.2rem'}}>
              Your Invite Codes
              <div style={{fontSize: '0.9rem', fontWeight: '400'}}>You may delete your used codes</div>
            </div>
    
              {userInviteCodes.map((invite, index) => (
                <div className='usersInvitesContainer' key={index}>
                  <div className={`codeBox ${invite.isUsed ? 'used' : 'notUsed'}`}>
                    {invite.code}
                  </div>

                  <button className='button' onClick={async () => {
                    await deleteUserInviteCode(invite.id);
                    fetchUserInviteCodes();
                  }}>Delete</button>
                </div>
              ))}
      
          </div>
        ) : (
          <p>No invite codes found.</p>
        )}
      </form>

    </div>
  );
});

export default InviteCodeForm;
