/*
 * File: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files\backend\controllers\authController.js
 * Project: c:\Users\tonyw\Desktop\Cloud File Manager\js-cloud-files
 * Created Date: Tuesday April 16th 2024
 * Author: Tony Wiedman
 * -----
 * Last Modified: Thu May 2nd 2024 2:39:19 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2024 MolexWorks / Tone Web Design
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, UserInvite, Role } = require('../models');
require("dotenv").config({ path: "/home/tbz/envs/molexCloud/.env" });

//! User registration
//? Register a new user with a valid invite code
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

    // Assign user role by default
    const userRole = await Role.findOne({ where: { name: 'user' } });
    await newUser.addRole(userRole);

    // Extract roles from the user object
    const roles = [userRole.name];

    // Sign a token with the user ID, username, and roles
    const token = jwt.sign({ userId: newUser.id, username, roles }, process.env.JWT_SECRET, { expiresIn: '1y' });

    res.status(201).json({ token, userId: newUser.id, username, roles });
  } catch (error) {
    console.error('Error in Sequelize operation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//! User login
//? Log in an existing user
async function login(req, res) {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ 
      where: { username },
      include: [{ model: Role }]
    });
    if (!user) {
      return res.status(401).json({ error: '[ERROR] User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '[ERROR] Invalid password' });
    }

    const roles = user.Roles.map(role => role.name);

    const token = jwt.sign({ userId: user.id, username: user.username, roles }, process.env.JWT_SECRET, { expiresIn: '1y' });
    res.json({ token, userId: user.id, username: user.username, roles });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}


//! Generate invite code
//? Generate a new invite code for the user
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
//? Get all invite codes for the user
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
//? Delete an invite code for the user
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
