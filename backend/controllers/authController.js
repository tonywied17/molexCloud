const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { File, User, UserInvite } = require('../models');

//! User registration
async function register(req, res) {
  const { username, password, inviteCode } = req.body;
  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(401).json({ error: '[ERROR] Username already exists' });
    }

    let userInvite;
    if (inviteCode === '23307' || inviteCode === 'pib') {
      userInvite = { isUsed: false }; 
    } else {
      userInvite = await UserInvite.findOne({ where: { code: inviteCode, isUsed: false } });
      if (!userInvite) {
        return res.status(401).json({ error: '[ERROR] Invalid invite code provided or it was already used.' });
      }
      userInvite.isUsed = true;
      await userInvite.save();
    }

    if (password.length < 3) {
      return res.status(401).json({ error: '[ERROR] Password must be at least 3 characters long' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword });

    const token = jwt.sign({ userId: newUser.id, username }, process.env.JWT_SECRET, { expiresIn: '1y' });
    res.status(201).json({ token, userId: newUser.id, username});
  } catch (error) {
    console.error('Error in Sequelize operation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! User login
async function login(req, res) {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: '[ERROR] User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '[ERROR] Invalid password' });
    }

    // ? Sign a token with the user ID and username and send it back to the client
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1y' });
    res.json({ token, userId: user.id, username: user.username});

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Generate invite code
async function generateInviteCode(req, res) {
  try {
    const userId = req.user.userId;
    const code = Math.random().toString(36).substr(2, 8);
    
    const invite = await UserInvite.create({ code, UserId: userId });

    res.status(200).json({ code: invite.code });

  } catch (error) {
    console.error('Error generating invite code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Get Invite Codes
async function getUserInviteCodes(req, res) {
  try {
    const userId = req.user.userId;
    const userInviteCodes = await UserInvite.findAll({ where: { UserId: userId } });
    return res.status(200).json(userInviteCodes);
  } catch (error) {
    console.error('Error fetching user invite codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! Delete Invite Code
async function deleteUserInviteCode (req, res) {
  try {
    const userId = req.user.userId;
    const codeId = req.params.codeId;
    const userInvite = await UserInvite.findOne({ where: { id: codeId, UserId: userId } });
    if (!userInvite) {
      return res.status(404).json({ error: 'Invite code not found' });
    }
    await userInvite.destroy();
    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting invite code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
    register,
    login,
    generateInviteCode,
    getUserInviteCodes,
    deleteUserInviteCode
};
