const express = require('express');
const CacheService = require('../services/cacheService');

const router = express.Router();
const cacheService = new CacheService();

// Wallet data cache endpoints
router.get('/wallet-data', async (req, res) => {
  try {
    const { walletId, dataType } = req.query;

    if (!walletId || !dataType) {
      return res.status(400).json({
        success: false,
        error: 'walletId and dataType are required'
      });
    }

    const data = await cacheService.getWalletData(walletId, dataType);

    if (data) {
      console.log('Cache hit for wallet data', { walletId, dataType });
      return res.json({
        success: true,
        data,
        fromCache: true
      });
    } else {
      console.log('Cache miss for wallet data', { walletId, dataType });
      return res.json({
        success: true,
        data: null,
        fromCache: false
      });
    }
  } catch (error) {
    console.error('Error getting wallet data from cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get wallet data from cache'
    });
  }
});

router.post('/wallet-data', async (req, res) => {
  try {
    const { walletId, dataType, data } = req.body;

    if (!walletId || !dataType || !data) {
      return res.status(400).json({
        success: false,
        error: 'walletId, dataType, and data are required'
      });
    }

    await cacheService.setWalletData(walletId, dataType, data);

    console.log('Wallet data cached', { walletId, dataType });
    return res.json({
      success: true,
      message: 'Wallet data cached successfully'
    });
  } catch (error) {
    console.error('Error setting wallet data in cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cache wallet data'
    });
  }
});

router.delete('/wallet-data', async (req, res) => {
  try {
    const { walletId, dataType } = req.query;

    if (!walletId) {
      return res.status(400).json({
        success: false,
        error: 'walletId is required'
      });
    }

    await cacheService.invalidateWalletData(walletId, dataType);

    console.log('Wallet data cache invalidated', { walletId, dataType });
    return res.json({
      success: true,
      message: 'Wallet data cache invalidated successfully'
    });
  } catch (error) {
    console.error('Error invalidating wallet data cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to invalidate wallet data cache'
    });
  }
});

// Metadata cache endpoints
router.get('/metadata', async (req, res) => {
  try {
    const { coinType } = req.query;

    if (!coinType) {
      return res.status(400).json({
        success: false,
        error: 'coinType is required'
      });
    }

    const metadata = await cacheService.getMetadata(coinType);

    if (metadata) {
      console.log('Cache hit for metadata', { coinType });
      return res.json({
        success: true,
        data: metadata,
        fromCache: true
      });
    } else {
      console.log('Cache miss for metadata', { coinType });
      return res.json({
        success: true,
        data: null,
        fromCache: false
      });
    }
  } catch (error) {
    console.error('Error getting metadata from cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get metadata from cache'
    });
  }
});

router.post('/metadata', async (req, res) => {
  try {
    const { coinType, metadata } = req.body;

    if (!coinType || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'coinType and metadata are required'
      });
    }

    await cacheService.setMetadata(coinType, metadata);

    console.log('Metadata cached', { coinType });
    return res.json({
      success: true,
      message: 'Metadata cached successfully'
    });
  } catch (error) {
    console.error('Error setting metadata in cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cache metadata'
    });
  }
});

router.put('/metadata', async (req, res) => {
  try {
    const { metadataMap } = req.body;

    if (!metadataMap || typeof metadataMap !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'metadataMap is required'
      });
    }

    await cacheService.setBatchMetadata(metadataMap);

    console.log('Batch metadata cached', { count: Object.keys(metadataMap).length });
    return res.json({
      success: true,
      message: 'Batch metadata cached successfully'
    });
  } catch (error) {
    console.error('Error setting batch metadata in cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cache batch metadata'
    });
  }
});

// Cache statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get cache stats'
    });
  }
});

module.exports = router; 