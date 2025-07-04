/**
 * Shared validation utilities for the Evarra application
 * Consolidates common validation patterns used across forms, wallets, and blockchain operations
 */

// Common field validators
export const sharedValidators = {
  // Basic field validators
  required: (value: any, fieldName: string): string | null => 
    !value || (typeof value === 'string' && value.trim().length === 0)
      ? `${fieldName} is required`
      : null,
  
  minLength: (value: string, min: number, fieldName: string): string | null =>
    value.length < min ? `${fieldName} must be at least ${min} characters` : null,
    
  maxLength: (value: string, max: number, fieldName: string): string | null =>
    value.length > max ? `${fieldName} must be ${max} characters or less` : null,
    
  email: (value: string): string | null =>
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email format' : null,
    
  positiveNumber: (value: number, fieldName: string): string | null =>
    value <= 0 ? `${fieldName} must be positive` : null,
    
  nonNegativeNumber: (value: number, fieldName: string): string | null =>
    value < 0 ? `${fieldName} cannot be negative` : null,
    
  numberRange: (value: number, min: number, max: number, fieldName: string): string | null =>
    value < min || value > max ? `${fieldName} must be between ${min} and ${max}` : null,
    
  // Blockchain address validators
  ethereumAddress: (address: string): string | null =>
    !/^0x[a-fA-F0-9]{40}$/.test(address) ? 'Invalid Ethereum address' : null,
    
  suiAddress: (address: string): string | null =>
    !/^0x[a-fA-F0-9]{64}$/.test(address) ? 'Invalid Sui address' : null,
    
  bitcoinAddress: (address: string): string | null =>
    !/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) ? 'Invalid Bitcoin address' : null,
    
  solanaAddress: (address: string): string | null =>
    !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) ? 'Invalid Solana address' : null,
    
  aptosAddress: (address: string): string | null =>
    !/^0x[a-fA-F0-9]{64}$/.test(address) ? 'Invalid Aptos address' : null,
    
  // Transaction validators
  transactionHash: (hash: string): string | null =>
    !/^[a-fA-F0-9]{64}$/.test(hash) ? 'Invalid transaction hash' : null,
    
  // Token validators
  tokenAmount: (amount: string): string | null => {
    try {
      const num = Number(amount);
      if (isNaN(num)) return 'Invalid token amount';
      BigInt(amount); // Check if it's a valid BigInt
      return null;
    } catch {
      return 'Invalid token amount';
    }
  },
  
  // Coin type validators (SUI specific)
  suiCoinType: (coinType: string): string | null => {
    const parts = coinType.split('::');
    if (parts.length !== 3) return 'Invalid coin type format';
    
    if (!parts[0].startsWith('0x') || !/^0x[a-fA-F0-9]{40}$/.test(parts[0])) {
      return 'Invalid package address in coin type';
    }
    
    if (!parts[1] || !parts[2]) return 'Module and name cannot be empty';
    
    return null;
  },
  
  // Metadata validators
  metadataSymbol: (symbol: string): string | null => {
    if (!symbol || symbol.length === 0) return 'Symbol is required';
    if (symbol.length > 10) return 'Symbol must be 10 characters or less';
    return null;
  },
  
  metadataName: (name: string): string | null => {
    if (!name || name.length === 0) return 'Name is required';
    if (name.length > 100) return 'Name must be 100 characters or less';
    return null;
  },
  
  metadataDecimals: (decimals: number): string | null => {
    if (decimals < 0 || decimals > 18) return 'Decimals must be between 0 and 18';
    return null;
  },
  
  // Label validators
  label: (label: string, maxLength: number = 50): string | null => {
    const trimmed = label.trim();
    if (trimmed.length === 0) return 'Label cannot be empty';
    if (trimmed.length > maxLength) return `Label must be ${maxLength} characters or less`;
    return null;
  }
};

// Blockchain-specific address validation by chain
export const validateAddressByChain = (address: string, chain: string): string | null => {
  const normalizedChain = chain.trim().toUpperCase();
  
  switch (normalizedChain) {
    case 'ETHEREUM':
    case 'ETH':
    case 'POLYGON':
    case 'MATIC':
    case 'ARBITRUM':
    case 'OPTIMISM':
    case 'BASE':
      return sharedValidators.ethereumAddress(address);
      
    case 'BITCOIN':
    case 'BTC':
      return sharedValidators.bitcoinAddress(address);
      
    case 'SOLANA':
    case 'SOL':
      return sharedValidators.solanaAddress(address);
      
    case 'SUI':
      return sharedValidators.suiAddress(address);
      
    case 'APTOS':
      return sharedValidators.aptosAddress(address);
      
    default:
      return 'Unsupported blockchain network';
  }
};

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidationError {
  field: string;
  message: string;
}

// Helper function to validate multiple fields
export const validateFields = (validations: Array<{ field: string; validator: () => string | null }>): FieldValidationError[] => {
  const errors: FieldValidationError[] = [];
  
  for (const { field, validator } of validations) {
    const error = validator();
    if (error) {
      errors.push({ field, message: error });
    }
  }
  
  return errors;
};

// Helper function to validate a single field
export const validateField = (field: string, validator: () => string | null): FieldValidationError | null => {
  const error = validator();
  return error ? { field, message: error } : null;
}; 