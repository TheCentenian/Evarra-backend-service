const { MongoClient, ObjectId } = require('mongodb');

class CacheService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        console.warn('MONGODB_URI not set, cache service will be disabled');
        return;
      }

      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(process.env.MONGODB_DATABASE || 'evarra');
      this.isConnected = true;
      console.log('✅ MongoDB cache service connected');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB cache service:', error.message);
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
    }
  }

  async getWalletDataCollection() {
    await this.connect();
    if (!this.isConnected) return null;
    return this.db.collection('wallet_data_cache');
  }

  async getMetadataCollection() {
    await this.connect();
    if (!this.isConnected) return null;
    return this.db.collection('metadata_cache');
  }

  // Wallet data cache operations
  async getWalletData(walletId, dataType) {
    try {
      const collection = await this.getWalletDataCollection();
      if (!collection) return null;

      const result = await collection.findOne({
        wallet_id: new ObjectId(walletId),
        data_type: dataType
      });

      return result ? result.data : null;
    } catch (error) {
      console.error('Error getting wallet data from cache:', error);
      return null;
    }
  }

  async setWalletData(walletId, dataType, data) {
    try {
      const collection = await this.getWalletDataCollection();
      if (!collection) return;

      await collection.updateOne(
        {
          wallet_id: new ObjectId(walletId),
          data_type: dataType
        },
        {
          $set: {
            data,
            last_fetched: new Date()
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error setting wallet data in cache:', error);
    }
  }

  async invalidateWalletData(walletId, dataType) {
    try {
      const collection = await this.getWalletDataCollection();
      if (!collection) return;

      const filter = { wallet_id: new ObjectId(walletId) };
      if (dataType) {
        filter.data_type = dataType;
      }

      await collection.deleteMany(filter);
    } catch (error) {
      console.error('Error invalidating wallet data cache:', error);
    }
  }

  // Metadata cache operations
  async getMetadata(coinType) {
    try {
      const collection = await this.getMetadataCollection();
      if (!collection) return null;

      const result = await collection.findOne({ coin_type: coinType });
      return result ? result.metadata : null;
    } catch (error) {
      console.error('Error getting metadata from cache:', error);
      return null;
    }
  }

  async setMetadata(coinType, metadata) {
    try {
      const collection = await this.getMetadataCollection();
      if (!collection) return;

      await collection.updateOne(
        { coin_type: coinType },
        {
          $set: {
            metadata,
            last_fetched: new Date()
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error setting metadata in cache:', error);
    }
  }

  async setBatchMetadata(metadataMap) {
    try {
      const collection = await this.getMetadataCollection();
      if (!collection) return;

      const operations = Object.entries(metadataMap).map(([coinType, metadata]) => ({
        updateOne: {
          filter: { coin_type: coinType },
          update: {
            $set: {
              metadata,
              last_fetched: new Date()
            }
          },
          upsert: true
        }
      }));

      if (operations.length > 0) {
        await collection.bulkWrite(operations);
      }
    } catch (error) {
      console.error('Error setting batch metadata in cache:', error);
    }
  }

  // Cache statistics
  async getCacheStats() {
    try {
      const walletDataCollection = await this.getWalletDataCollection();
      const metadataCollection = await this.getMetadataCollection();

      if (!walletDataCollection || !metadataCollection) {
        return {
          totalEntries: 0,
          totalSize: 0,
          hitRate: 0,
          missRate: 0,
          lastCleared: new Date(),
          chains: {}
        };
      }

      const [walletDataCount, metadataCount] = await Promise.all([
        walletDataCollection.countDocuments(),
        metadataCollection.countDocuments()
      ]);

      return {
        totalEntries: walletDataCount + metadataCount,
        totalSize: 0, // TODO: Implement size calculation
        hitRate: 0, // TODO: Implement hit rate calculation
        missRate: 0, // TODO: Implement miss rate calculation
        lastCleared: new Date(),
        chains: {} // TODO: Implement chain breakdown
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        lastCleared: new Date(),
        chains: {}
      };
    }
  }
}

module.exports = CacheService; 