const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

//! User registration
async function register(req, res) {
    const { username, password } = req.body;
  
    console.log(username, password)
    try {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      await User.create({ username, password: hashedPassword });
      const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.status(201).json({ token });
    } catch (error) {
      console.error('Error in Sequelize operation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

//! User login
async function login(req, res) {
  const { username, password } = req.body;

  console.log(username, password)
  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
    register,
    login
};
