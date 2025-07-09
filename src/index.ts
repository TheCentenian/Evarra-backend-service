import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { logger } from './utils/logger';
import { validateAddressByChain } from './utils/validation';

// Load environment variables
dotenv.config();

// Common token metadata mapping
const KNOWN_TOKENS: Record<string, any> = {
  '0x2::sui::SUI': {
    symbol: 'SUI',
    name: 'Sui',
    decimals: 9,
    iconUrl: '/icons/sui.svg'
  }
};

// Shared function for fetching SUI holdings
const fetchSuiHoldings = async (address: string, forceRefresh = false) => {
  // Validate request parameters
  if (!address) {
    throw new Error('Missing address parameter');
  }

  // Validate SUI address format
  const addressError = validateAddressByChain(address, 'SUI');
  if (addressError) {
    throw new Error(addressError);
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

  return {
    success: true,
    data: { holdings },
    metadata: {
      duration: 0, // TODO: Add timing
      timestamp: new Date().toISOString(),
      service: 'evarra-backend-service'
    }
  };
};

// Shared function for fetching SUI transactions
const fetchSuiTransactions = async (address: string, limit: string | number = 50, cursor: string | null = null) => {
  // Validate request parameters
  if (!address) {
    throw new Error('Missing address parameter');
  }

  // Validate SUI address format
  const addressError = validateAddressByChain(address, 'SUI');
  if (addressError) {
    throw new Error(addressError);
  }

  // Parse and validate limit
  const parsedLimit = typeof limit === 'string' ? parseInt(limit) : limit;
  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new Error('Invalid limit parameter. Must be between 1 and 100.');
  }

  // Initialize Sui client
  const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

  // Log request parameters
  logger.info('Fetching transactions with params', {
    address,
    limit: parsedLimit,
    cursor: cursor || 'none'
  });

  // Fetch transactions with all needed data
  const response = await client.queryTransactionBlocks({
    filter: {
      FromAddress: address
    },
    options: {
      showInput: true,
      showEffects: true,
      showEvents: true,
      showBalanceChanges: true
    },
    limit: parsedLimit,
    cursor: cursor || undefined
  });

  // Log the response for debugging
  logger.info('Successfully fetched SUI transactions', {
    transactionCount: response.data.length,
    hasNextPage: response.hasNextPage,
    nextCursor: response.nextCursor
  });

  return {
    success: true,
    data: {
      transactions: response.data,
      nextCursor: response.nextCursor,
      hasNextPage: response.hasNextPage
    },
    metadata: {
      duration: 0, // TODO: Add timing
      timestamp: new Date().toISOString(),
      service: 'evarra-backend-service'
    }
  };
};

// Shared function for fetching SUI metadata
const fetchSuiMetadata = async (coinTypes: string[]) => {
  // Validate request parameters
  if (!Array.isArray(coinTypes)) {
    throw new Error('Invalid request body. Expected array of coinTypes.');
  }

  if (coinTypes.length === 0) {
    throw new Error('Empty coin types array.');
  }

  if (!coinTypes.every(type => typeof type === 'string')) {
    throw new Error('All coin types must be strings.');
  }

  // Initialize Sui client
  const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
  const metadata: Record<string, any> = {};
  const errors: Record<string, string> = {};

  // Fetch metadata for each coin type
  for (const coinType of coinTypes) {
    try {
      // Check known tokens first
      if (KNOWN_TOKENS[coinType]) {
        const apiMetadata = await client.getCoinMetadata({ coinType });
        metadata[coinType] = {
          ...apiMetadata,
          ...KNOWN_TOKENS[coinType],
          iconUrl: KNOWN_TOKENS[coinType].iconUrl || apiMetadata?.iconUrl
        };
      } else {
        const apiMetadata = await client.getCoinMetadata({ coinType });
        if (apiMetadata) {
          metadata[coinType] = apiMetadata;
        } else {
          // Extract basic info from coin type
          const parts = coinType.split('::');
          if (parts.length >= 3) {
            const symbol = parts[parts.length - 1].toUpperCase();
            const name = parts[parts.length - 1]
              .split(/(?=[A-Z])/)
              .join(' ')
              .trim();

            metadata[coinType] = {
              symbol,
              name,
              decimals: 9 // Default to 9 decimals
            };
          }
        }
      }
    } catch (error) {
      logger.error('Error fetching metadata for coin type', { coinType, error });
      errors[coinType] = error instanceof Error ? error.message : 'Failed to fetch metadata';
    }
  }

  logger.info('Successfully fetched SUI metadata', {
    coinTypesCount: coinTypes.length,
    metadataCount: Object.keys(metadata).length,
    errorCount: Object.keys(errors).length
  });

  return {
    success: true,
    data: { metadata, errors },
    metadata: {
      duration: 0, // TODO: Add timing
      timestamp: new Date().toISOString(),
      service: 'evarra-backend-service'
    }
  };
};

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration with support for multiple origins
const corsOrigins = process.env.CORS_ORIGIN || 'http://localhost:3000';
const allowedOrigins = corsOrigins.split(',').map(origin => origin.trim());

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
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

// SUI holdings endpoint - GET (for easy testing)
app.get('/api/sui/holdings', async (req, res) => {
  try {
    const { address, forceRefresh } = req.query;
    const result = await fetchSuiHoldings(address as string, forceRefresh === 'true');
    res.json(result);
  } catch (error) {
    logger.error('Error fetching SUI holdings (GET)', {
      address: req.query.address,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch holdings'
    });
  }
});

// SUI holdings endpoint - POST (for production use)
app.post('/api/sui/holdings', async (req, res) => {
  try {
    const { address, forceRefresh } = req.body;
    const result = await fetchSuiHoldings(address, forceRefresh);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching SUI holdings (POST)', {
      address: req.body.address,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch holdings'
    });
  }
});

// SUI transactions endpoint - GET (for easy testing)
app.get('/api/sui/transactions', async (req, res) => {
  try {
    const { address, limit, cursor } = req.query;
    const result = await fetchSuiTransactions(address as string, limit as string, cursor as string);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching SUI transactions (GET)', {
      address: req.query.address,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions'
    });
  }
});

// SUI transactions endpoint - POST (for production use)
app.post('/api/sui/transactions', async (req, res) => {
  try {
    const { address, limit, cursor } = req.body;
    const result = await fetchSuiTransactions(address, limit, cursor);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching SUI transactions (POST)', {
      address: req.body.address,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions'
    });
  }
});

// SUI metadata endpoint - POST only (matches worker format)
app.post('/api/sui/metadata', async (req, res) => {
  try {
    const { coinTypes } = req.body;
    const result = await fetchSuiMetadata(coinTypes);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching SUI metadata', {
      coinTypes: req.body.coinTypes,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch metadata'
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
        holdings: {
          get: '/api/sui/holdings?address=YOUR_ADDRESS',
          post: '/api/sui/holdings'
        },
        transactions: {
          get: '/api/sui/transactions?address=YOUR_ADDRESS&limit=50',
          post: '/api/sui/transactions'
        },
        metadata: {
          post: '/api/sui/metadata'
        }
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Evarra Backend Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 SUI Holdings (GET): http://localhost:${PORT}/api/sui/holdings?address=YOUR_ADDRESS`);
  console.log(`🔗 SUI Holdings (POST): POST http://localhost:${PORT}/api/sui/holdings`);
  console.log(`🔗 SUI Transactions (GET): http://localhost:${PORT}/api/sui/transactions?address=YOUR_ADDRESS&limit=50`);
  console.log(`🔗 SUI Transactions (POST): POST http://localhost:${PORT}/api/sui/transactions`);
  console.log(`🔗 SUI Metadata (POST): POST http://localhost:${PORT}/api/sui/metadata`);
}); 