const express = require('express');
const router = express.Router();

// Mock users database (in production, use a real database with hashed passwords)
const users = [
  { id: 1, username: 'hr@company.com', password: 'hr123', role: 'hr', name: 'HR Manager' },
  { id: 2, username: 'john@company.com', password: 'john123', role: 'employee', name: 'John Doe', employeeId: 1 },
  { id: 3, username: 'jane@company.com', password: 'jane123', role: 'employee', name: 'Jane Smith', employeeId: 2 },
  { id: 4, username: 'bob@company.com', password: 'bob123', role: 'employee', name: 'Bob Johnson', employeeId: 3 }
];

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Return user info without password
  const { password: _, ...userInfo } = user;
  res.json({ 
    message: 'Login successful',
    user: userInfo
  });
});

// Get current user (for session validation)
router.post('/validate', (req, res) => {
  const { userId } = req.body;
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid session' });
  }
  
  const { password: _, ...userInfo } = user;
  res.json({ user: userInfo });
});

// Get all users (for admin/demo purposes)
router.get('/users', (req, res) => {
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
});

// Register new user (for HR to create accounts)
router.post('/register', (req, res) => {
  const { username, password, role, name, employeeId } = req.body;
  
  if (!username || !password || !role || !name) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  // Check if username already exists
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  
  const newUser = {
    id: users.length + 1,
    username,
    password,
    role,
    name,
    employeeId: employeeId || null
  };
  
  users.push(newUser);
  
  const { password: _, ...userInfo } = newUser;
  res.status(201).json({ 
    message: 'Account created successfully',
    user: userInfo
  });
});

module.exports = router;
