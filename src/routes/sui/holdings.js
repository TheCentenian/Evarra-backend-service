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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@mysten/sui/client");
const logger_1 = require("../../utils/logger");
const validation_1 = require("../../utils/validation");
const router = (0, express_1.Router)();
// SUI holdings endpoint
router.post('/holdings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { address, forceRefresh } = req.body;
    try {
        // Validate request parameters
        if (!address) {
            logger_1.logger.error('Missing address parameter');
            return res.status(400).json({
                success: false,
                error: 'Missing address parameter'
            });
        }
        // Validate SUI address format
        const addressError = (0, validation_1.validateAddressByChain)(address, 'SUI');
        if (addressError) {
            logger_1.logger.error('Invalid address format', { address });
            return res.status(400).json({
                success: false,
                error: addressError
            });
        }
        // Initialize Sui client
        const client = new client_1.SuiClient({ url: (0, client_1.getFullnodeUrl)('mainnet') });
        // Fetch balances using SUI SDK
        const balances = yield client.getAllBalances({ owner: address });
        // Transform balances into holdings format
        const holdings = balances.map(balance => ({
            coinType: balance.coinType,
            balance: balance.totalBalance,
            objectId: '', // Not available in getAllBalances
            objectCount: 1 // Not available in getAllBalances
        }));
        // Log the response for debugging
        logger_1.logger.info('Successfully fetched SUI holdings', {
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching SUI holdings', {
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
}));
exports.default = router;
