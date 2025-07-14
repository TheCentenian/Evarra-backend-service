const express = require('express');
const router = express.Router();
const MongoDBUserService = require('../services/userService');

// Initialize user service
const userService = new MongoDBUserService();

// User registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }
    
    // Create user
    const user = await userService.createUser({
      username,
      email,
      password
    });
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User registered successfully'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

// User login endpoint
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Basic validation
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username/email and password are required'
      });
    }
    
    // Authenticate user
    const user = await userService.authenticateUser(identifier, password);
    
    res.json({
      success: true,
      data: user,
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
});

// Get user by ID endpoint
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

// Update user endpoint
router.put('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const updatedUser = await userService.updateUser(userId, updates);
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update user'
    });
  }
});

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'auth-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 