"use strict";
/**
 * Shared validation utilities for the Evarra application
 * Consolidates common validation patterns used across forms, wallets, and blockchain operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateField = exports.validateFields = exports.validateAddressByChain = exports.sharedValidators = void 0;
// Common field validators
exports.sharedValidators = {
    // Basic field validators
    required: (value, fieldName) => !value || (typeof value === 'string' && value.trim().length === 0)
        ? `${fieldName} is required`
        : null,
    minLength: (value, min, fieldName) => value.length < min ? `${fieldName} must be at least ${min} characters` : null,
    maxLength: (value, max, fieldName) => value.length > max ? `${fieldName} must be ${max} characters or less` : null,
    email: (value) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email format' : null,
    positiveNumber: (value, fieldName) => value <= 0 ? `${fieldName} must be positive` : null,
    nonNegativeNumber: (value, fieldName) => value < 0 ? `${fieldName} cannot be negative` : null,
    numberRange: (value, min, max, fieldName) => value < min || value > max ? `${fieldName} must be between ${min} and ${max}` : null,
    // Blockchain address validators
    ethereumAddress: (address) => !/^0x[a-fA-F0-9]{40}$/.test(address) ? 'Invalid Ethereum address' : null,
    suiAddress: (address) => !/^0x[a-fA-F0-9]{64}$/.test(address) ? 'Invalid Sui address' : null,
    bitcoinAddress: (address) => !/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) ? 'Invalid Bitcoin address' : null,
    solanaAddress: (address) => !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) ? 'Invalid Solana address' : null,
    aptosAddress: (address) => !/^0x[a-fA-F0-9]{64}$/.test(address) ? 'Invalid Aptos address' : null,
    // Transaction validators
    transactionHash: (hash) => !/^[a-fA-F0-9]{64}$/.test(hash) ? 'Invalid transaction hash' : null,
    // Token validators
    tokenAmount: (amount) => {
        try {
            const num = Number(amount);
            if (isNaN(num))
                return 'Invalid token amount';
            BigInt(amount); // Check if it's a valid BigInt
            return null;
        }
        catch (_a) {
            return 'Invalid token amount';
        }
    },
    // Coin type validators (SUI specific)
    suiCoinType: (coinType) => {
        const parts = coinType.split('::');
        if (parts.length !== 3)
            return 'Invalid coin type format';
        if (!parts[0].startsWith('0x') || !/^0x[a-fA-F0-9]{40}$/.test(parts[0])) {
            return 'Invalid package address in coin type';
        }
        if (!parts[1] || !parts[2])
            return 'Module and name cannot be empty';
        return null;
    },
    // Metadata validators
    metadataSymbol: (symbol) => {
        if (!symbol || symbol.length === 0)
            return 'Symbol is required';
        if (symbol.length > 10)
            return 'Symbol must be 10 characters or less';
        return null;
    },
    metadataName: (name) => {
        if (!name || name.length === 0)
            return 'Name is required';
        if (name.length > 100)
            return 'Name must be 100 characters or less';
        return null;
    },
    metadataDecimals: (decimals) => {
        if (decimals < 0 || decimals > 18)
            return 'Decimals must be between 0 and 18';
        return null;
    },
    // Label validators
    label: (label, maxLength = 50) => {
        const trimmed = label.trim();
        if (trimmed.length === 0)
            return 'Label cannot be empty';
        if (trimmed.length > maxLength)
            return `Label must be ${maxLength} characters or less`;
        return null;
    }
};
// Blockchain-specific address validation by chain
const validateAddressByChain = (address, chain) => {
    const normalizedChain = chain.trim().toUpperCase();
    switch (normalizedChain) {
        case 'ETHEREUM':
        case 'ETH':
        case 'POLYGON':
        case 'MATIC':
        case 'ARBITRUM':
        case 'OPTIMISM':
        case 'BASE':
            return exports.sharedValidators.ethereumAddress(address);
        case 'BITCOIN':
        case 'BTC':
            return exports.sharedValidators.bitcoinAddress(address);
        case 'SOLANA':
        case 'SOL':
            return exports.sharedValidators.solanaAddress(address);
        case 'SUI':
            return exports.sharedValidators.suiAddress(address);
        case 'APTOS':
            return exports.sharedValidators.aptosAddress(address);
        default:
            return 'Unsupported blockchain network';
    }
};
exports.validateAddressByChain = validateAddressByChain;
// Helper function to validate multiple fields
const validateFields = (validations) => {
    const errors = [];
    for (const { field, validator } of validations) {
        const error = validator();
        if (error) {
            errors.push({ field, message: error });
        }
    }
    return errors;
};
exports.validateFields = validateFields;
// Helper function to validate a single field
const validateField = (field, validator) => {
    const error = validator();
    return error ? { field, message: error } : null;
};
exports.validateField = validateField;
