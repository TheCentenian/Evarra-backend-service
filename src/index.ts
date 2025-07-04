import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { logger } from './utils/logger';
import { validateAddressByChain } from './utils/validation';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'evarra-backend-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// SUI holdings endpoint
app.post('/api/sui/holdings', async (req, res) => {
  const { address, forceRefresh } = req.body;

  try {
    // Validate request parameters
    if (!address) {
      logger.error('Missing address parameter');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing address parameter' 
      });
    }

    // Validate SUI address format
    const addressError = validateAddressByChain(address, 'SUI');
    if (addressError) {
      logger.error('Invalid address format', { address });
      return res.status(400).json({ 
        success: false, 
        error: addressError 
      });
    }

    // Initialize Sui client
    const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

    // Fetch balances using SUI SDK
    const balances = await client.getAllBalances({ owner: address });

    // Transform balances into holdings format
    const holdings = balances.map(balance => ({
      coinType: balance.coinType,
      balance: balance.totalBalance,
      objectId: '', // Not available in getAllBalances
      objectCount: 1 // Not available in getAllBalances
    }));

    // Log the response for debugging
    logger.info('Successfully fetched SUI holdings', { 
      address,
      holdingsCount: holdings.length,
      holdings: holdings.map(h => ({
        coinType: h.coinType,
        balance: h.balance
      }))
    });

    return res.json({
      success: true,
      data: { holdings },
      metadata: {
        duration: 0, // TODO: Add timing
        timestamp: new Date().toISOString(),
        service: 'evarra-backend-service'
      }
    });

  } catch (error) {
    logger.error('Error fetching SUI holdings', {
      address,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch holdings'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Evarra Backend Service',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      sui: {
        holdings: '/api/sui/holdings'
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Evarra Backend Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 SUI Holdings: POST http://localhost:${PORT}/api/sui/holdings`);
}); 