const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

class MongoDBWalletService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/evarra';
      this.client = new MongoClient(mongoUri);
      
      await this.client.connect();
      this.db = this.client.db(process.env.MONGODB_DATABASE || 'evarra');
      this.isConnected = true;
      
      console.log('MongoDB connected successfully for wallets service');
    } catch (error) {
      console.error('MongoDB connection failed for wallets service:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('MongoDB disconnected for wallets service');
    }
  }

  // Helper method to ensure connection
  async ensureConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  // Validate wallet data
  validateWalletData(walletData) {
    const errors = [];

    if (!walletData.label || walletData.label.trim().length === 0) {
      errors.push('Wallet label is required');
    }

    if (!walletData.address || walletData.address.trim().length === 0) {
      errors.push('Wallet address is required');
    }

    if (!walletData.chain || walletData.chain.trim().length === 0) {
      errors.push('Blockchain chain is required');
    }

    // Validate supported chains
    const supportedChains = ['ethereum', 'bitcoin', 'solana', 'sui', 'aptos', 'polygon', 'arbitrum', 'optimism', 'base'];
    if (!supportedChains.includes(walletData.chain.toLowerCase())) {
      errors.push(`Unsupported chain. Supported chains: ${supportedChains.join(', ')}`);
    }

    // Basic address format validation
    if (walletData.address && walletData.chain) {
      const addressError = this.validateAddressByChain(walletData.address, walletData.chain);
      if (addressError) {
        errors.push(addressError);
      }
    }

    return errors;
  }

  // Validate address format by chain
  validateAddressByChain(address, chain) {
    const normalizedChain = chain.toLowerCase();
    
    switch (normalizedChain) {
      case 'sui':
        return /^0x[a-fA-F0-9]{64}$/.test(address) ? null : 'Invalid SUI address format (should be 0x followed by 64 hex characters)';
      
      case 'ethereum':
      case 'polygon':
      case 'arbitrum':
      case 'optimism':
      case 'base':
        return /^0x[a-fA-F0-9]{40}$/.test(address) ? null : 'Invalid Ethereum address format (should be 0x followed by 40 hex characters)';
      
      case 'bitcoin':
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address) ? null : 'Invalid Bitcoin address format';
      
      case 'solana':
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) ? null : 'Invalid Solana address format';
      
      case 'aptos':
        return /^0x[a-fA-F0-9]{64}$/.test(address) ? null : 'Invalid Aptos address format (should be 0x followed by 64 hex characters)';
      
      default:
        return 'Unsupported blockchain chain';
    }
  }

  // Core wallet operations
  async createWallet(walletData) {
    await this.ensureConnection();
    
    try {
      // Validate wallet data
      const validationErrors = this.validateWalletData(walletData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const collection = this.db.collection('wallets');
      
      // Check if user exists (basic validation)
      const userCollection = this.db.collection('users');
      const user = await userCollection.findOne({ _id: new ObjectId(walletData.user_id) });
      if (!user) {
        throw new Error('User not found');
      }

      // Check if wallet already exists for this user
      const existingWallet = await collection.findOne({
        userId: walletData.user_id,
        address: walletData.address.toLowerCase(),
        chain: walletData.chain.toLowerCase()
      });

      if (existingWallet) {
        throw new Error('Wallet with this address and chain already exists for this user');
      }

      const now = new Date();
      const newWallet = {
        userId: walletData.user_id, // Keep as string to match frontend
        address: walletData.address.toLowerCase().trim(),
        label: walletData.label.trim(),
        chain: walletData.chain.toLowerCase().trim(),
        createdAt: now,
        updatedAt: now
      };
      
      const result = await collection.insertOne(newWallet);
      
      // Return wallet with proper format matching frontend
      const createdWallet = {
        id: result.insertedId.toString(),
        userId: newWallet.userId,
        address: newWallet.address,
        label: newWallet.label,
        chain: newWallet.chain,
        createdAt: newWallet.createdAt.toISOString(),
        updatedAt: newWallet.updatedAt.toISOString()
      };
      
      console.log('Wallet created successfully:', { 
        walletId: createdWallet.id, 
        label: createdWallet.label,
        address: createdWallet.address,
        chain: createdWallet.chain,
        userId: createdWallet.user_id 
      });
      return createdWallet;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  async getWalletById(walletId) {
    await this.ensureConnection();
    
    try {
      if (!ObjectId.isValid(walletId)) {
        throw new Error('Invalid wallet ID format');
      }

      const collection = this.db.collection('wallets');
      const wallet = await collection.findOne({ _id: new ObjectId(walletId) });
      
      if (!wallet) return null;
      
      // Return wallet with proper format
      return {
        id: wallet._id.toString(),
        userId: wallet.userId,
        address: wallet.address,
        label: wallet.label,
        chain: wallet.chain,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error getting wallet by ID:', error);
      throw error;
    }
  }

  async getUserWallets(userId) {
    await this.ensureConnection();
    
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      const collection = this.db.collection('wallets');
      const wallets = await collection.find({ userId: userId }).toArray();
      
      // Return wallets with proper format matching frontend
      return wallets.map(wallet => ({
        id: wallet._id.toString(),
        userId: wallet.userId,
        address: wallet.address,
        label: wallet.label,
        chain: wallet.chain,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error getting user wallets:', error);
      throw error;
    }
  }

  async updateWallet(walletId, updates) {
    await this.ensureConnection();
    
    try {
      if (!ObjectId.isValid(walletId)) {
        throw new Error('Invalid wallet ID format');
      }

      const collection = this.db.collection('wallets');
      
      // Get existing wallet
      const existingWallet = await collection.findOne({ _id: new ObjectId(walletId) });
      if (!existingWallet) {
        throw new Error('Wallet not found');
      }

      // Prepare update data
      const updateData = {
        updated_at: new Date()
      };

      // Update fields if provided
      if (updates.label !== undefined) {
        updateData.label = updates.label.trim();
        if (updateData.label.length === 0) {
          throw new Error('Wallet label cannot be empty');
        }
      }

      if (updates.address !== undefined) {
        updateData.address = updates.address.toLowerCase().trim();
        if (updateData.address.length === 0) {
          throw new Error('Wallet address cannot be empty');
        }
        // Validate new address format
        const addressError = this.validateAddressByChain(updateData.address, existingWallet.chain);
        if (addressError) {
          throw new Error(addressError);
        }
      }

      if (updates.chain !== undefined) {
        updateData.chain = updates.chain.toLowerCase().trim();
        const supportedChains = ['ethereum', 'bitcoin', 'solana', 'sui', 'aptos', 'polygon', 'arbitrum', 'optimism', 'base'];
        if (!supportedChains.includes(updateData.chain)) {
          throw new Error(`Unsupported chain. Supported chains: ${supportedChains.join(', ')}`);
        }
        // Validate address format for new chain
        const addressError = this.validateAddressByChain(existingWallet.address, updateData.chain);
        if (addressError) {
          throw new Error(addressError);
        }
      }

      // Check for duplicate wallet if address or chain changed
      if (updates.address || updates.chain) {
        const newAddress = updates.address ? updates.address.toLowerCase() : existingWallet.address;
        const newChain = updates.chain ? updates.chain.toLowerCase() : existingWallet.chain;
        
        const duplicateWallet = await collection.findOne({
          user_id: existingWallet.user_id,
          address: newAddress,
          chain: newChain,
          _id: { $ne: new ObjectId(walletId) }
        });

        if (duplicateWallet) {
          throw new Error('Wallet with this address and chain already exists for this user');
        }
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(walletId) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Wallet not found');
      }

      // Return updated wallet
      const updatedWallet = await this.getWalletById(walletId);
      
      console.log('Wallet updated successfully:', { 
        walletId, 
        updates: Object.keys(updates)
      });
      return updatedWallet;
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  }

  async deleteWallet(walletId) {
    await this.ensureConnection();
    
    try {
      if (!ObjectId.isValid(walletId)) {
        throw new Error('Invalid wallet ID format');
      }

      const collection = this.db.collection('wallets');
      
      // Get wallet before deletion for logging
      const wallet = await collection.findOne({ _id: new ObjectId(walletId) });
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const result = await collection.deleteOne({ _id: new ObjectId(walletId) });

      if (result.deletedCount === 0) {
        throw new Error('Wallet not found');
      }

      console.log('Wallet deleted successfully:', { 
        walletId, 
        label: wallet.label,
        address: wallet.address,
        chain: wallet.chain
      });
      
      return {
        id: walletId,
        message: 'Wallet deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  }

  async getAllWallets() {
    await this.ensureConnection();
    
    try {
      const collection = this.db.collection('wallets');
      const wallets = await collection.find({}).toArray();
      
      // Return wallets with proper format matching frontend
      return wallets.map(wallet => ({
        id: wallet._id.toString(),
        userId: wallet.userId,
        address: wallet.address,
        label: wallet.label,
        chain: wallet.chain,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error getting all wallets:', error);
      throw error;
    }
  }

  async getWalletByAddress(userId, address, chain) {
    await this.ensureConnection();
    
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      const collection = this.db.collection('wallets');
      
      // Debug the query parameters
      console.log('🔍 Debug getWalletByAddress:', {
        userId,
        address: address.toLowerCase(),
        chain: chain.toLowerCase()
      });
      
      const wallet = await collection.findOne({
        userId: userId, // Use userId (string) to match createWallet
        address: address.toLowerCase(),
        chain: chain.toLowerCase()
      });
      
      console.log('🔍 Debug wallet found:', wallet ? 'YES' : 'NO');
      
      if (!wallet) return null;
      
      // Return wallet with proper format matching frontend
      return {
        id: wallet._id.toString(),
        userId: wallet.userId,
        address: wallet.address,
        label: wallet.label,
        chain: wallet.chain,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error getting wallet by address:', error);
      throw error;
    }
  }

  async getWalletsByChain(userId, chain) {
    await this.ensureConnection();
    
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      const collection = this.db.collection('wallets');
      const wallets = await collection.find({
        userId: userId,
        chain: chain.toLowerCase()
      }).toArray();
      
      // Return wallets with proper format matching frontend
      return wallets.map(wallet => ({
        id: wallet._id.toString(),
        userId: wallet.userId,
        address: wallet.address,
        label: wallet.label,
        chain: wallet.chain,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error getting wallets by chain:', error);
      throw error;
    }
  }
}

module.exports = MongoDBWalletService; 