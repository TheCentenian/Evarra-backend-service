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
const logger = {
    info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
    error: (message, data) => console.error(`[ERROR] ${message}`, data || ''),
    warn: (message, data) => console.warn(`[WARN] ${message}`, data || '')
};
const validateSuiAddress = (address) => {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
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
});
