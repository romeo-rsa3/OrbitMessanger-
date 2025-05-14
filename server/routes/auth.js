const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ success: false, message: "User exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password }); // hashes automatically
  await user.save();

  res.json({ success: true });
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Attempting login for: ${username}`);

  const user = await User.findOne({ username });
  if (!user) {
    console.log('User not found');
    return res.status(400).json({ success: false, message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    console.log('Password mismatch');
    return res.status(400).json({ success: false, message: "Invalid credentials" });
  }

  console.log('Login successful');
  res.json({ success: true });
});


module.exports = router;
