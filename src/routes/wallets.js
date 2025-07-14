const express = require('express');
const router = express.Router();
const MongoDBWalletService = require('../services/walletService');

// Health check for wallets service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'wallets-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Initialize wallet service
const walletService = new MongoDBWalletService();

// Create wallet endpoint
router.post('/', async (req, res) => {
  try {
    const { user_id, address, label, chain } = req.body;
    
    // Basic validation
    if (!user_id || !address || !label || !chain) {
      return res.status(400).json({
        success: false,
        error: 'All required fields are required: user_id, address, label, chain'
      });
    }
    
    // Create wallet
    const wallet = await walletService.createWallet({
      user_id,
      address,
      label,
      chain
    });
    
    res.status(201).json({
      success: true,
      data: wallet,
      message: 'Wallet created successfully'
    });
    
  } catch (error) {
    console.error('Create wallet error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create wallet'
    });
  }
});

// Get user wallets endpoint
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const wallets = await walletService.getUserWallets(userId);
    
    res.json({
      success: true,
      data: wallets,
      count: wallets.length
    });
    
  } catch (error) {
    console.error('Get user wallets error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user wallets'
    });
  }
});

// Get wallet by ID endpoint
router.get('/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    
    const wallet = await walletService.getWalletById(walletId);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }
    
    res.json({
      success: true,
      data: wallet
    });
    
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get wallet'
    });
  }
});

// Update wallet endpoint
router.put('/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const updates = req.body;
    
    // Validate that at least one field is being updated
    const allowedFields = ['label', 'address', 'chain'];
    const hasValidUpdates = allowedFields.some(field => updates[field] !== undefined);
    
    if (!hasValidUpdates) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update: label, address, or chain'
      });
    }
    
    const updatedWallet = await walletService.updateWallet(walletId, updates);
    
    res.json({
      success: true,
      data: updatedWallet,
      message: 'Wallet updated successfully'
    });
    
  } catch (error) {
    console.error('Update wallet error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update wallet'
    });
  }
});

// Delete wallet endpoint
router.delete('/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    
    const result = await walletService.deleteWallet(walletId);
    
    res.json({
      success: true,
      data: result,
      message: 'Wallet deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete wallet error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete wallet'
    });
  }
});

// Get wallet by address and chain endpoint
router.get('/user/:userId/address/:address/chain/:chain', async (req, res) => {
  try {
    const { userId, address, chain } = req.params;
    
    console.log('🔍 Route Debug - getWalletByAddress:', {
      userId,
      address,
      chain,
      params: req.params
    });
    
    const wallet = await walletService.getWalletByAddress(userId, address, chain);
    
    console.log('🔍 Route Debug - wallet found:', wallet ? 'YES' : 'NO');
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }
    
    res.json({
      success: true,
      data: wallet
    });
    
  } catch (error) {
    console.error('Get wallet by address error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get wallet by address'
    });
  }
});

// Get user wallets by chain endpoint
router.get('/user/:userId/chain/:chain', async (req, res) => {
  try {
    const { userId, chain } = req.params;
    
    const wallets = await walletService.getWalletsByChain(userId, chain);
    
    res.json({
      success: true,
      data: wallets,
      count: wallets.length
    });
    
  } catch (error) {
    console.error('Get wallets by chain error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get wallets by chain'
    });
  }
});

// Get all wallets endpoint (admin/development)
router.get('/', async (req, res) => {
  try {
    const wallets = await walletService.getAllWallets();
    
    res.json({
      success: true,
      data: wallets,
      count: wallets.length
    });
    
  } catch (error) {
    console.error('Get all wallets error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get all wallets'
    });
  }
});

module.exports = router; 