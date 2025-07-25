"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goals');
const walletRoutes = require('./routes/wallets');
const cacheRoutes = require('./routes/cache');
const logger = {
    info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
    error: (message, data) => console.error(`[ERROR] ${message}`, data || ''),
    warn: (message, data) => console.warn(`[WARN] ${message}`, data || ''),
    debug: (message, data) => console.debug(`[DEBUG] ${message}`, data || '')
};
const validateSuiAddress = (address) => {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
};

// Common token metadata mapping
const KNOWN_TOKENS = {
    '0x2::sui::SUI': {
        symbol: 'SUI',
        name: 'Sui',
        decimals: 9,
        iconUrl: '/icons/sui.svg'
    }
};

// Shared function for fetching SUI holdings
const fetchSuiHoldings = async (address, forceRefresh = false) => {
    // Validate request parameters
    if (!address) {
        throw new Error('Missing address parameter');
    }

    // Validate SUI address format
    if (!validateSuiAddress(address)) {
        throw new Error('Invalid SUI address format');
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
const fetchSuiTransactions = async (address, limit = 50, cursor = null) => {
    // Validate request parameters
    if (!address) {
        throw new Error('Missing address parameter');
    }

    // Validate SUI address format
    if (!validateSuiAddress(address)) {
        throw new Error('Invalid SUI address format');
    }

    // Parse and validate limit
    const parsedLimit = parseInt(limit);
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

    try {
        // Fetch both incoming and outgoing transactions using dual API calls
        logger.info('Fetching transactions using bidirectional approach...');
        
        // Make two parallel API calls: one for outgoing (FromAddress) and one for incoming (ToAddress)
        const [outgoingResponse, incomingResponse] = await Promise.all([
            client.queryTransactionBlocks({
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
            }),
            client.queryTransactionBlocks({
                filter: {
                    ToAddress: address
                },
                options: {
                    showInput: true,
                    showEffects: true,
                    showEvents: true,
                    showBalanceChanges: true
                },
                limit: parsedLimit,
                cursor: cursor || undefined
            })
        ]);
        
        // Log raw responses for debugging
        logger.info('Raw API responses', {
            outgoingResponseData: outgoingResponse.data?.length || 0,
            incomingResponseData: incomingResponse.data?.length || 0,
            outgoingHasNextPage: outgoingResponse.hasNextPage,
            incomingHasNextPage: incomingResponse.hasNextPage,
            outgoingNextCursor: outgoingResponse.nextCursor,
            incomingNextCursor: incomingResponse.nextCursor
        });
        
        // Combine and deduplicate transactions
        const allTransactions = [...outgoingResponse.data, ...incomingResponse.data];
        const transactionMap = new Map();
        
        allTransactions.forEach(tx => {
            if (!transactionMap.has(tx.digest)) {
                transactionMap.set(tx.digest, tx);
            } else {
                logger.debug('Duplicate transaction found during deduplication', {
                    digest: tx.digest,
                    existingSender: transactionMap.get(tx.digest).transaction?.data?.sender,
                    newSender: tx.transaction?.data?.sender
                });
            }
        });
        
        const relevantTransactions = Array.from(transactionMap.values());
        
        // Log deduplication results
        logger.info('Deduplication completed', {
            totalCombined: allTransactions.length,
            afterDeduplication: relevantTransactions.length,
            duplicatesRemoved: allTransactions.length - relevantTransactions.length
        });
        
        logger.info('Bidirectional fetch results', {
            outgoingCount: outgoingResponse.data.length,
            incomingCount: incomingResponse.data.length,
            totalCombined: allTransactions.length,
            afterDeduplication: relevantTransactions.length
        });

        // Log transaction details for debugging
        relevantTransactions.forEach(tx => {
            const sender = tx.transaction?.data?.sender;
            const isOutgoing = sender === address;
            
            logger.debug('Processing transaction', { 
                digest: tx.digest, 
                sender, 
                isOutgoing,
                address 
            });
        });

        // Sort by timestamp (newest first) - FIXED VERSION
        relevantTransactions.sort((a, b) => {
            const timeA = parseInt(a.timestampMs || 0);
            const timeB = parseInt(b.timestampMs || 0);
            
            // Add error handling for invalid timestamps
            if (isNaN(timeA) || isNaN(timeB)) {
                logger.warn('Invalid timestamp found during sorting', { 
                    a: a.timestampMs, 
                    b: b.timestampMs,
                    digestA: a.digest,
                    digestB: b.digest
                });
                return 0;
            }
            
            return timeB - timeA; // Newest first
        });
        
        // Log sorting results for debugging
        logger.info('Sorting completed', {
            totalTransactions: relevantTransactions.length,
            firstTransaction: relevantTransactions[0] ? {
                digest: relevantTransactions[0].digest,
                timestamp: relevantTransactions[0].timestampMs,
                sender: relevantTransactions[0].transaction?.data?.sender
            } : null,
            secondTransaction: relevantTransactions[1] ? {
                digest: relevantTransactions[1].digest,
                timestamp: relevantTransactions[1].timestampMs,
                sender: relevantTransactions[1].transaction?.data?.sender
            } : null
        });

        // Take only the requested limit
        const limitedTransactions = relevantTransactions.slice(0, parsedLimit);

        // Determine pagination - if either response has more pages, we have more data
        const hasNextPage = outgoingResponse.hasNextPage || incomingResponse.hasNextPage;
        const nextCursor = outgoingResponse.nextCursor || incomingResponse.nextCursor;

        const responseData = {
            data: limitedTransactions,
            hasNextPage,
            nextCursor
        };

        // Log the response for debugging
        logger.info('Successfully fetched SUI transactions (BIDIRECTIONAL)', {
            address,
            outgoingFetched: outgoingResponse.data.length,
            incomingFetched: incomingResponse.data.length,
            totalCombined: allTransactions.length,
            finalCount: responseData.data.length,
            hasNextPage: responseData.hasNextPage,
            nextCursor: responseData.nextCursor,
            sampleTransactions: responseData.data.slice(0, 3).map(tx => ({
                digest: tx.digest,
                sender: tx.transaction?.data?.sender,
                timestamp: tx.timestampMs,
                balanceChanges: tx.balanceChanges?.length || 0,
                isIncoming: tx.transaction?.data?.sender !== address
            }))
        });

        return {
            success: true,
            data: {
                transactions: responseData.data,
                nextCursor: responseData.nextCursor,
                hasNextPage: responseData.hasNextPage
            },
            metadata: {
                duration: 0, // TODO: Add timing
                timestamp: new Date().toISOString(),
                service: 'evarra-backend-service'
            }
        };
    } catch (error) {
        logger.error('Error fetching transactions from Sui API', {
            address,
            limit: parsedLimit,
            cursor,
            error: error instanceof Error ? {
                message: error.message,
                name: error.name,
                stack: error.stack
            } : error
        });
        
        // Return empty result with error info
        return {
            success: true,
            data: {
                transactions: [],
                nextCursor: null,
                hasNextPage: false
            },
            metadata: {
                duration: 0,
                timestamp: new Date().toISOString(),
                service: 'evarra-backend-service',
                error: error.message || 'Unknown error occurred'
            }
        };
    }
};

// Shared function for fetching SUI metadata
const fetchSuiMetadata = async (coinTypes) => {
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
    const metadata = {};
    const errors = {};

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
            errors[coinType] = error.message || 'Failed to fetch metadata';
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
    origin: function (origin, callback) {
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

// Auth routes
app.use('/api/auth', authRoutes);

// Goals routes
app.use('/api/goals', goalRoutes);

// Wallets routes
app.use('/api/wallets', walletRoutes);

// Cache routes
app.use('/api/cache', cacheRoutes);

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
        const result = await fetchSuiHoldings(address, forceRefresh);
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
            error: error.message || 'Failed to fetch holdings'
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
            error: error.message || 'Failed to fetch holdings'
        });
    }
});

// SUI transactions endpoint - GET (for easy testing)
app.get('/api/sui/transactions', async (req, res) => {
    try {
        const { address, limit, cursor } = req.query;
        const result = await fetchSuiTransactions(address, limit, cursor);
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
            error: error.message || 'Failed to fetch transactions'
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
            error: error.message || 'Failed to fetch transactions'
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
            error: error.message || 'Failed to fetch metadata'
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
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                getUser: 'GET /api/auth/user/:userId',
                updateUser: 'PUT /api/auth/user/:userId',
                health: 'GET /api/auth/health'
            },
            goals: {
                create: 'POST /api/goals',
                getById: 'GET /api/goals/:goalId',
                getUserGoals: 'GET /api/goals/user/:userId',
                update: 'PUT /api/goals/:goalId',
                delete: 'DELETE /api/goals/:goalId',
                getProgress: 'GET /api/goals/:goalId/progress',
                updateProgress: 'PUT /api/goals/:goalId/progress',
                getAll: 'GET /api/goals',
                health: 'GET /api/goals/health'
            },
            wallets: {
                create: 'POST /api/wallets',
                getById: 'GET /api/wallets/:walletId',
                getUserWallets: 'GET /api/wallets/user/:userId',
                update: 'PUT /api/wallets/:walletId',
                delete: 'DELETE /api/wallets/:walletId',
                getByAddress: 'GET /api/wallets/user/:userId/address/:address/chain/:chain',
                getByChain: 'GET /api/wallets/user/:userId/chain/:chain',
                getAll: 'GET /api/wallets',
                health: 'GET /api/wallets/health'
            },
            cache: {
                walletData: {
                    get: 'GET /api/cache/wallet-data?walletId=ID&dataType=holdings',
                    post: 'POST /api/cache/wallet-data',
                    delete: 'DELETE /api/cache/wallet-data?walletId=ID'
                },
                metadata: {
                    get: 'GET /api/cache/metadata?coinType=TYPE',
                    post: 'POST /api/cache/metadata',
                    put: 'PUT /api/cache/metadata'
                },
                stats: 'GET /api/cache/stats'
            },
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
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Use HTTP for production (Render)
  app.listen(PORT, '0.0.0.0', () => {
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    console.log(`🚀 Evarra Backend Service running on HTTP port ${PORT}`);
    console.log(`📊 Health check: ${baseUrl}/api/health`);
    console.log(`🔐 Auth Register: POST ${baseUrl}/api/auth/register`);
    console.log(`🔐 Auth Login: POST ${baseUrl}/api/auth/login`);
    console.log(`🔐 Auth Health: GET ${baseUrl}/api/auth/health`);
    console.log(`🎯 Goals Create: POST ${baseUrl}/api/goals`);
    console.log(`🎯 Goals Get User: GET ${baseUrl}/api/goals/user/:userId`);
    console.log(`🎯 Goals Health: GET ${baseUrl}/api/goals/health`);
    console.log(`💰 Wallets Create: POST ${baseUrl}/api/wallets`);
    console.log(`💰 Wallets Get User: GET ${baseUrl}/api/wallets/user/:userId`);
    console.log(`💰 Wallets Health: GET ${baseUrl}/api/wallets/health`);
    console.log(`🔗 SUI Holdings (GET): ${baseUrl}/api/sui/holdings?address=YOUR_ADDRESS`);
    console.log(`🔗 SUI Holdings (POST): POST ${baseUrl}/api/sui/holdings`);
    console.log(`🔗 SUI Transactions (GET): ${baseUrl}/api/sui/transactions?address=YOUR_ADDRESS&limit=50`);
    console.log(`🔗 SUI Transactions (POST): POST ${baseUrl}/api/sui/transactions`);
    console.log(`🔗 SUI Metadata (POST): POST ${baseUrl}/api/sui/metadata`);
  });
} else {
  // Use HTTPS for development (if certificates exist)
  const https = require('https');
  const fs = require('fs');
  
  try {
    const sslOptions = {
      key: fs.readFileSync('server.key'),
      cert: fs.readFileSync('server.cert')
    };

    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`🚀 Evarra Backend Service running on HTTPS port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth Register: POST http://localhost:${PORT}/api/auth/register`);
      console.log(`🔐 Auth Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`🔐 Auth Health: GET http://localhost:${PORT}/api/auth/health`);
      console.log(`🎯 Goals Create: POST http://localhost:${PORT}/api/goals`);
      console.log(`🎯 Goals Get User: GET http://localhost:${PORT}/api/goals/user/:userId`);
      console.log(`🎯 Goals Health: GET http://localhost:${PORT}/api/goals/health`);
      console.log(`💰 Wallets Create: POST http://localhost:${PORT}/api/wallets`);
      console.log(`💰 Wallets Get User: GET http://localhost:${PORT}/api/wallets/user/:userId`);
      console.log(`💰 Wallets Health: GET http://localhost:${PORT}/api/wallets/health`);
      console.log(`🔗 SUI Holdings (GET): http://localhost:${PORT}/api/sui/holdings?address=YOUR_ADDRESS`);
      console.log(`🔗 SUI Holdings (POST): POST http://localhost:${PORT}/api/sui/holdings`);
      console.log(`🔗 SUI Transactions (GET): http://localhost:${PORT}/api/sui/transactions?address=YOUR_ADDRESS&limit=50`);
      console.log(`🔗 SUI Transactions (POST): POST http://localhost:${PORT}/api/sui/transactions`);
      console.log(`🔗 SUI Metadata (POST): POST http://localhost:${PORT}/api/sui/metadata`);
    });
  } catch (error) {
    console.log('SSL certificates not found, falling back to HTTP for development');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Evarra Backend Service running on HTTP port ${PORT} (development mode)`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth Register: POST http://localhost:${PORT}/api/auth/register`);
      console.log(`🔐 Auth Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`🔐 Auth Health: GET http://localhost:${PORT}/api/auth/health`);
      console.log(`🎯 Goals Create: POST http://localhost:${PORT}/api/goals`);
      console.log(`🎯 Goals Get User: GET http://localhost:${PORT}/api/goals/user/:userId`);
      console.log(`🎯 Goals Health: GET http://localhost:${PORT}/api/goals/health`);
      console.log(`💰 Wallets Create: POST http://localhost:${PORT}/api/wallets`);
      console.log(`💰 Wallets Get User: GET http://localhost:${PORT}/api/wallets/user/:userId`);
      console.log(`💰 Wallets Health: GET http://localhost:${PORT}/api/wallets/health`);
      console.log(`🔗 SUI Holdings (GET): http://localhost:${PORT}/api/sui/holdings?address=YOUR_ADDRESS`);
      console.log(`🔗 SUI Holdings (POST): POST http://localhost:${PORT}/api/sui/holdings`);
      console.log(`🔗 SUI Transactions (GET): http://localhost:${PORT}/api/sui/transactions?address=YOUR_ADDRESS&limit=50`);
      console.log(`🔗 SUI Transactions (POST): POST http://localhost:${PORT}/api/sui/transactions`);
      console.log(`🔗 SUI Metadata (POST): POST http://localhost:${PORT}/api/sui/metadata`);
    });
  }
}
