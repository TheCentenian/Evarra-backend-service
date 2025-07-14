const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

class MongoDBGoalService {
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
      
      console.log('MongoDB connected successfully for goals service');
    } catch (error) {
      console.error('MongoDB connection failed for goals service:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('MongoDB disconnected for goals service');
    }
  }

  // Helper method to ensure connection
  async ensureConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  // Validate goal data
  validateGoalData(goalData) {
    const errors = [];

    if (!goalData.name || goalData.name.trim().length === 0) {
      errors.push('Goal name is required');
    }

    if (!goalData.coin || goalData.coin.trim().length === 0) {
      errors.push('Coin is required');
    }

    if (!goalData.coin_symbol || goalData.coin_symbol.trim().length === 0) {
      errors.push('Coin symbol is required');
    }

    if (typeof goalData.current_amount !== 'number' || goalData.current_amount < 0) {
      errors.push('Current amount must be a non-negative number');
    }

    if (typeof goalData.target_amount !== 'number' || goalData.target_amount <= 0) {
      errors.push('Target amount must be a positive number');
    }

    if (goalData.current_amount > goalData.target_amount) {
      errors.push('Current amount cannot exceed target amount');
    }

    if (!goalData.goal_type || !['regular', 'parent', 'subgoal'].includes(goalData.goal_type)) {
      errors.push('Goal type must be one of: regular, parent, subgoal');
    }

    if (goalData.parent_goal_id && !ObjectId.isValid(goalData.parent_goal_id)) {
      errors.push('Invalid parent goal ID format');
    }

    return errors;
  }

  // Core goal operations
  async createGoal(goalData) {
    await this.ensureConnection();
    
    try {
      // Validate goal data
      const validationErrors = this.validateGoalData(goalData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const collection = this.db.collection('goals');
      
      // Check if user exists (basic validation)
      const userCollection = this.db.collection('users');
      const user = await userCollection.findOne({ _id: new ObjectId(goalData.user_id) });
      if (!user) {
        throw new Error('User not found');
      }

      // Check if parent goal exists (if provided)
      if (goalData.parent_goal_id) {
        const parentGoal = await collection.findOne({ _id: new ObjectId(goalData.parent_goal_id) });
        if (!parentGoal) {
          throw new Error('Parent goal not found');
        }
      }

      const now = new Date();
      const newGoal = {
        user_id: new ObjectId(goalData.user_id),
        name: goalData.name.trim(),
        description: goalData.description || '',
        status: goalData.status || 'active',
        progress: goalData.progress || 0,
        coin: goalData.coin.trim(),
        coin_symbol: goalData.coin_symbol.trim(),
        current_amount: goalData.current_amount,
        target_amount: goalData.target_amount,
        target_date: goalData.target_date || null,
        wallet_id: goalData.wallet_id || null,
        wallet_address: goalData.wallet_address || null,
        wallet_chain: goalData.wallet_chain || null,
        goal_type: goalData.goal_type,
        parent_goal_id: goalData.parent_goal_id ? new ObjectId(goalData.parent_goal_id) : null,
        is_aggregate: goalData.is_aggregate || false,
        milestones: goalData.milestones || [],
        notes: goalData.notes || goalData.name.trim(),
        created_at: now,
        updated_at: now
      };
      
      const result = await collection.insertOne(newGoal);
      
      // Return goal with calculated progress
      const createdGoal = {
        id: result.insertedId.toString(),
        user_id: newGoal.user_id.toString(),
        name: newGoal.name,
        description: newGoal.description,
        status: newGoal.status,
        progress: newGoal.progress,
        coin: newGoal.coin,
        coin_symbol: newGoal.coin_symbol,
        current_amount: newGoal.current_amount,
        target_amount: newGoal.target_amount,
        target_date: newGoal.target_date,
        wallet_id: newGoal.wallet_id,
        wallet_address: newGoal.wallet_address,
        wallet_chain: newGoal.wallet_chain,
        goal_type: newGoal.goal_type,
        parent_goal_id: newGoal.parent_goal_id ? newGoal.parent_goal_id.toString() : null,
        is_aggregate: newGoal.is_aggregate,
        milestones: newGoal.milestones,
        notes: newGoal.notes,
        progress_percentage: Math.round((newGoal.current_amount / newGoal.target_amount) * 100),
        created_at: newGoal.created_at.toISOString(),
        updated_at: newGoal.updated_at.toISOString()
      };
      
      console.log('Goal created successfully:', { 
        goalId: createdGoal.id, 
        title: createdGoal.title,
        userId: createdGoal.user_id 
      });
      return createdGoal;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  async getGoalById(goalId) {
    await this.ensureConnection();
    
    try {
      if (!ObjectId.isValid(goalId)) {
        throw new Error('Invalid goal ID format');
      }

      const collection = this.db.collection('goals');
      const goal = await collection.findOne({ _id: new ObjectId(goalId) });
      
      if (!goal) return null;
      
      // Return goal with calculated progress
      return {
        id: goal._id.toString(),
        user_id: goal.user_id.toString(),
        name: goal.name,
        description: goal.description,
        status: goal.status,
        progress: goal.progress,
        coin: goal.coin,
        coin_symbol: goal.coin_symbol,
        current_amount: goal.current_amount,
        target_amount: goal.target_amount,
        target_date: goal.target_date,
        wallet_id: goal.wallet_id,
        wallet_address: goal.wallet_address,
        wallet_chain: goal.wallet_chain,
        goal_type: goal.goal_type,
        parent_goal_id: goal.parent_goal_id ? goal.parent_goal_id.toString() : null,
        is_aggregate: goal.is_aggregate,
        milestones: goal.milestones,
        notes: goal.notes,
        progress_percentage: Math.round((goal.current_amount / goal.target_amount) * 100),
        created_at: goal.created_at.toISOString(),
        updated_at: goal.updated_at.toISOString()
      };
    } catch (error) {
      console.error('Error getting goal by ID:', error);
      throw error;
    }
  }

  async getUserGoals(userId) {
    await this.ensureConnection();
    
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      const collection = this.db.collection('goals');
      const goals = await collection.find({ user_id: new ObjectId(userId) }).toArray();
      
      // Return goals with calculated progress
      return goals.map(goal => ({
        id: goal._id.toString(),
        user_id: goal.user_id.toString(),
        name: goal.name,
        description: goal.description,
        status: goal.status,
        progress: goal.progress,
        coin: goal.coin,
        coin_symbol: goal.coin_symbol,
        current_amount: goal.current_amount,
        target_amount: goal.target_amount,
        target_date: goal.target_date,
        wallet_id: goal.wallet_id,
        wallet_address: goal.wallet_address,
        wallet_chain: goal.wallet_chain,
        goal_type: goal.goal_type,
        parent_goal_id: goal.parent_goal_id ? goal.parent_goal_id.toString() : null,
        is_aggregate: goal.is_aggregate,
        milestones: goal.milestones,
        notes: goal.notes,
        progress_percentage: Math.round((goal.current_amount / goal.target_amount) * 100),
        created_at: goal.created_at.toISOString(),
        updated_at: goal.updated_at.toISOString()
      }));
    } catch (error) {
      console.error('Error getting user goals:', error);
      throw error;
    }
  }

  async updateGoal(goalId, updates) {
    await this.ensureConnection();
    
    try {
      if (!ObjectId.isValid(goalId)) {
        throw new Error('Invalid goal ID format');
      }

      const collection = this.db.collection('goals');
      
      // Check if goal exists
      const existingGoal = await collection.findOne({ _id: new ObjectId(goalId) });
      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      // Validate updates if provided
      if (updates.title !== undefined && (!updates.title || updates.title.trim().length === 0)) {
        throw new Error('Goal title cannot be empty');
      }

      if (updates.coin !== undefined && (!updates.coin || updates.coin.trim().length === 0)) {
        throw new Error('Coin cannot be empty');
      }

      if (updates.coin_symbol !== undefined && (!updates.coin_symbol || updates.coin_symbol.trim().length === 0)) {
        throw new Error('Coin symbol cannot be empty');
      }

      if (updates.current_amount !== undefined && (typeof updates.current_amount !== 'number' || updates.current_amount < 0)) {
        throw new Error('Current amount must be a non-negative number');
      }

      if (updates.target_amount !== undefined && (typeof updates.target_amount !== 'number' || updates.target_amount <= 0)) {
        throw new Error('Target amount must be a positive number');
      }

      if (updates.goal_type !== undefined && !['regular', 'parent', 'subgoal'].includes(updates.goal_type)) {
        throw new Error('Goal type must be one of: regular, parent, subgoal');
      }

      if (updates.parent_goal_id !== undefined && updates.parent_goal_id && !ObjectId.isValid(updates.parent_goal_id)) {
        throw new Error('Invalid parent goal ID format');
      }

      // Check if parent goal exists (if updating)
      if (updates.parent_goal_id) {
        const parentGoal = await collection.findOne({ _id: new ObjectId(updates.parent_goal_id) });
        if (!parentGoal) {
          throw new Error('Parent goal not found');
        }
      }

      // Prepare update object
      const updateData = {
        ...updates,
        updated_at: new Date()
      };

      // Convert string IDs to ObjectIds if needed
      if (updateData.parent_goal_id) {
        updateData.parent_goal_id = new ObjectId(updateData.parent_goal_id);
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(goalId) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Goal not found');
      }

      // Get updated goal
      const updatedGoal = await this.getGoalById(goalId);
      
      console.log('Goal updated successfully:', { 
        goalId, 
        title: updatedGoal.title 
      });
      
      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  async deleteGoal(goalId) {
    await this.ensureConnection();
    
    try {
      if (!ObjectId.isValid(goalId)) {
        throw new Error('Invalid goal ID format');
      }

      const collection = this.db.collection('goals');
      
      // Check if goal exists
      const existingGoal = await collection.findOne({ _id: new ObjectId(goalId) });
      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      // Check if goal has subgoals
      const subgoals = await collection.find({ parent_goal_id: new ObjectId(goalId) }).toArray();
      if (subgoals.length > 0) {
        throw new Error('Cannot delete goal with subgoals. Please delete subgoals first.');
      }

      const result = await collection.deleteOne({ _id: new ObjectId(goalId) });

      if (result.deletedCount === 0) {
        throw new Error('Goal not found');
      }

      console.log('Goal deleted successfully:', { goalId });
      
      return { success: true, message: 'Goal deleted successfully' };
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }

  async getGoalProgress(goalId) {
    await this.ensureConnection();
    
    try {
      const goal = await this.getGoalById(goalId);
      if (!goal) {
        throw new Error('Goal not found');
      }

      const progress = {
        current_amount: goal.current_amount,
        target_amount: goal.target_amount,
        progress_percentage: goal.progress_percentage,
        remaining_amount: goal.target_amount - goal.current_amount,
        is_completed: goal.current_amount >= goal.target_amount
      };

      return progress;
    } catch (error) {
      console.error('Error getting goal progress:', error);
      throw error;
    }
  }

  async updateGoalProgress(goalId, newAmount) {
    await this.ensureConnection();
    
    try {
      if (typeof newAmount !== 'number' || newAmount < 0) {
        throw new Error('New amount must be a non-negative number');
      }

      const collection = this.db.collection('goals');
      
      // Check if goal exists
      const existingGoal = await collection.findOne({ _id: new ObjectId(goalId) });
      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      if (newAmount > existingGoal.target_amount) {
        throw new Error('Current amount cannot exceed target amount');
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(goalId) },
        { 
          $set: { 
            current_amount: newAmount,
            updated_at: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Goal not found');
      }

      // Get updated goal
      const updatedGoal = await this.getGoalById(goalId);
      
      console.log('Goal progress updated successfully:', { 
        goalId, 
        newAmount,
        progressPercentage: updatedGoal.progress_percentage 
      });
      
      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }

  async getAllGoals() {
    await this.ensureConnection();
    
    try {
      const collection = this.db.collection('goals');
      const goals = await collection.find({}).toArray();
      
      return goals.map(goal => ({
        id: goal._id.toString(),
        user_id: goal.user_id.toString(),
        title: goal.title,
        coin: goal.coin,
        coin_symbol: goal.coin_symbol,
        current_amount: goal.current_amount,
        target_amount: goal.target_amount,
        goal_type: goal.goal_type,
        parent_goal_id: goal.parent_goal_id ? goal.parent_goal_id.toString() : null,
        progress_percentage: Math.round((goal.current_amount / goal.target_amount) * 100),
        created_at: goal.created_at.toISOString(),
        updated_at: goal.updated_at.toISOString()
      }));
    } catch (error) {
      console.error('Error getting all goals:', error);
      throw error;
    }
  }
}

module.exports = MongoDBGoalService; 