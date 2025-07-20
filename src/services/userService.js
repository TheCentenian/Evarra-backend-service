const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

class MongoDBUserService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // TODO: Replace with actual MongoDB URI when Atlas is set up
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/evarra';
      
      // SSL/TLS configuration for MongoDB Atlas compatibility
      const options = {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        tlsInsecure: false,
        // Additional SSL options for production
        ...(process.env.NODE_ENV === 'production' && {
          sslValidate: true,
          checkServerIdentity: () => undefined, // Skip hostname verification for Atlas
        }),
      };
      
      this.client = new MongoClient(mongoUri, options);
      
      await this.client.connect();
      this.db = this.client.db(process.env.MONGODB_DATABASE || 'evarra');
      this.isConnected = true;
      
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('MongoDB disconnected');
    }
  }

  // Helper method to ensure connection
  async ensureConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  // Password hashing
  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Core user operations
  async createUser(userData) {
    await this.ensureConnection();
    
    try {
      const collection = this.db.collection('users');
      
      // Check if user already exists
      const existingUser = await collection.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });
      
      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }
      
      // Hash the password
      const hashedPassword = await this.hashPassword(userData.password);
      
      const now = new Date();
      const newUser = {
        username: userData.username,
        email: userData.email,
        password_hash: hashedPassword,
        tier: userData.tier || 'free',
        unlocks: userData.unlocks || [],
        theme: userData.theme || 'light',
        skill_level: userData.skillLevel || 'beginner',
        advanced_account_menu: userData.advancedAccountMenu || false,
        created_at: now,
        updated_at: now
      };
      
      const result = await collection.insertOne(newUser);
      
      // Return user without password hash
      const createdUser = {
        id: result.insertedId.toString(),
        username: newUser.username,
        email: newUser.email,
        tier: newUser.tier,
        unlocks: newUser.unlocks,
        theme: newUser.theme,
        skillLevel: newUser.skill_level,
        advancedAccountMenu: newUser.advanced_account_menu,
        createdAt: newUser.created_at.toISOString(),
        updatedAt: newUser.updated_at.toISOString()
      };
      
      console.log('User created successfully:', { username: createdUser.username, email: createdUser.email });
      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    await this.ensureConnection();
    
    try {
      const collection = this.db.collection('users');
      const user = await collection.findOne({ _id: new ObjectId(userId) });
      
      if (!user) return null;
      
      // Return user without password hash
      return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        tier: user.tier,
        unlocks: user.unlocks,
        theme: user.theme,
        skillLevel: user.skill_level,
        advancedAccountMenu: user.advanced_account_menu,
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at.toISOString()
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async getUserByEmail(email) {
    await this.ensureConnection();
    
    try {
      const collection = this.db.collection('users');
      const user = await collection.findOne({ email });
      
      if (!user) return null;
      
      return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        tier: user.tier,
        unlocks: user.unlocks,
        theme: user.theme,
        skillLevel: user.skill_level,
        advancedAccountMenu: user.advanced_account_menu,
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at.toISOString()
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async getUserByUsername(username) {
    await this.ensureConnection();
    
    try {
      const collection = this.db.collection('users');
      const user = await collection.findOne({ username });
      
      if (!user) return null;
      
      return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        tier: user.tier,
        unlocks: user.unlocks,
        theme: user.theme,
        skillLevel: user.skill_level,
        advancedAccountMenu: user.advanced_account_menu,
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at.toISOString()
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  }

  async updateUser(userId, updates) {
    await this.ensureConnection();
    
    try {
      const collection = this.db.collection('users');
      
      // Prepare update data
      const updateData = {
        updated_at: new Date()
      };
      
      // Map frontend field names to database field names
      if (updates.username) updateData.username = updates.username;
      if (updates.email) updateData.email = updates.email;
      if (updates.tier) updateData.tier = updates.tier;
      if (updates.unlocks) updateData.unlocks = updates.unlocks;
      if (updates.theme) updateData.theme = updates.theme;
      if (updates.skillLevel) updateData.skill_level = updates.skillLevel;
      if (updates.advancedAccountMenu !== undefined) updateData.advanced_account_menu = updates.advancedAccountMenu;
      
      // Hash password if provided
      if (updates.password) {
        updateData.password_hash = await this.hashPassword(updates.password);
      }
      
      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }
      
      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    await this.ensureConnection();
    
    try {
      const collection = this.db.collection('users');
      const result = await collection.deleteOne({ _id: new ObjectId(userId) });
      
      if (result.deletedCount === 0) {
        throw new Error('User not found');
      }
      
      console.log('User deleted successfully:', { userId });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Authentication operations
  async authenticateUser(identifier, password) {
    await this.ensureConnection();
    
    try {
      const collection = this.db.collection('users');
      
      // Find user by email or username
      const user = await collection.findOne({
        $or: [
          { email: identifier },
          { username: identifier }
        ]
      });
      
      if (!user) {
        throw new Error('Invalid username/email or password');
      }
      
      // Verify password
      const isPasswordValid = await this.comparePassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        throw new Error('Invalid username/email or password');
      }
      
      console.log('User authenticated successfully:', { username: user.username, email: user.email });
      
      // Return user without password hash
      return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        tier: user.tier,
        unlocks: user.unlocks,
        theme: user.theme,
        skillLevel: user.skill_level,
        advancedAccountMenu: user.advanced_account_menu,
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at.toISOString()
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // User management operations
  async setUserTier(userId, tier) {
    return await this.updateUser(userId, { tier });
  }

  async addUserUnlock(userId, featureId) {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUnlocks = [...user.unlocks, featureId];
    return await this.updateUser(userId, { unlocks: updatedUnlocks });
  }

  async getUserUnlocks(userId) {
    const user = await this.getUserById(userId);
    return user?.unlocks || [];
  }

  async setUserTheme(userId, theme) {
    return await this.updateUser(userId, { theme });
  }

  async setUserSkillLevel(userId, skillLevel) {
    return await this.updateUser(userId, { skillLevel });
  }

  async toggleAdvancedAccountMenu(userId) {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');
    
    return await this.updateUser(userId, { 
      advancedAccountMenu: !user.advancedAccountMenu 
    });
  }

  // Utility operations
  async getAllUsers() {
    await this.ensureConnection();
    
    try {
      const collection = this.db.collection('users');
      const users = await collection.find({}).toArray();
      
      return users.map(user => ({
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        tier: user.tier,
        unlocks: user.unlocks,
        theme: user.theme,
        skillLevel: user.skill_level,
        advancedAccountMenu: user.advanced_account_menu,
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at.toISOString()
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async validateUserSession(user) {
    if (!user || !user.id) return false;
    
    try {
      const dbUser = await this.getUserById(user.id);
      return dbUser !== null;
    } catch (error) {
      console.error('Error validating user session:', error);
      return false;
    }
  }
}

module.exports = MongoDBUserService; 