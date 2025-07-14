const express = require('express');
const router = express.Router();
const MongoDBGoalService = require('../services/goalService');

// Health check for goals service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'goals-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Initialize goal service
const goalService = new MongoDBGoalService();

// Create goal endpoint
router.post('/', async (req, res) => {
  try {
    const { user_id, name, description, status, progress, coin, coin_symbol, current_amount, target_amount, target_date, wallet_id, wallet_address, wallet_chain, goal_type, parent_goal_id, is_aggregate, milestones, notes } = req.body;
    
    // Basic validation
    if (!user_id || !name || !coin || !coin_symbol || current_amount === undefined || target_amount === undefined || !goal_type) {
      return res.status(400).json({
        success: false,
        error: 'All required fields are required: user_id, name, coin, coin_symbol, current_amount, target_amount, goal_type'
      });
    }
    
    // Create goal
    const goal = await goalService.createGoal({
      user_id,
      name,
      description,
      status,
      progress,
      coin,
      coin_symbol,
      current_amount: Number(current_amount),
      target_amount: Number(target_amount),
      target_date,
      wallet_id,
      wallet_address,
      wallet_chain,
      goal_type,
      parent_goal_id,
      is_aggregate,
      milestones,
      notes
    });
    
    res.status(201).json({
      success: true,
      data: goal,
      message: 'Goal created successfully'
    });
    
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create goal'
    });
  }
});

// Get user goals endpoint
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const goals = await goalService.getUserGoals(userId);
    
    res.json({
      success: true,
      data: goals,
      count: goals.length
    });
    
  } catch (error) {
    console.error('Get user goals error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user goals'
    });
  }
});

// Get goal by ID endpoint
router.get('/:goalId', async (req, res) => {
  try {
    const { goalId } = req.params;
    
    const goal = await goalService.getGoalById(goalId);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
    }
    
    res.json({
      success: true,
      data: goal
    });
    
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get goal'
    });
  }
});

// Update goal endpoint
router.put('/:goalId', async (req, res) => {
  try {
    const { goalId } = req.params;
    const updates = req.body;
    
    // Convert numeric fields if provided
    if (updates.current_amount !== undefined) {
      updates.current_amount = Number(updates.current_amount);
    }
    if (updates.target_amount !== undefined) {
      updates.target_amount = Number(updates.target_amount);
    }
    
    const updatedGoal = await goalService.updateGoal(goalId, updates);
    
    res.json({
      success: true,
      data: updatedGoal,
      message: 'Goal updated successfully'
    });
    
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update goal'
    });
  }
});

// Delete goal endpoint
router.delete('/:goalId', async (req, res) => {
  try {
    const { goalId } = req.params;
    
    const result = await goalService.deleteGoal(goalId);
    
    res.json({
      success: true,
      data: result,
      message: 'Goal deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete goal'
    });
  }
});

// Get goal progress endpoint
router.get('/:goalId/progress', async (req, res) => {
  try {
    const { goalId } = req.params;
    
    const progress = await goalService.getGoalProgress(goalId);
    
    res.json({
      success: true,
      data: progress
    });
    
  } catch (error) {
    console.error('Get goal progress error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get goal progress'
    });
  }
});

// Update goal progress endpoint
router.put('/:goalId/progress', async (req, res) => {
  try {
    const { goalId } = req.params;
    const { current_amount } = req.body;
    
    if (current_amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'current_amount is required'
      });
    }
    
    const updatedGoal = await goalService.updateGoalProgress(goalId, Number(current_amount));
    
    res.json({
      success: true,
      data: updatedGoal,
      message: 'Goal progress updated successfully'
    });
    
  } catch (error) {
    console.error('Update goal progress error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update goal progress'
    });
  }
});

// Get all goals endpoint (admin/development)
router.get('/', async (req, res) => {
  try {
    const goals = await goalService.getAllGoals();
    
    res.json({
      success: true,
      data: goals,
      count: goals.length
    });
    
  } catch (error) {
    console.error('Get all goals error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get all goals'
    });
  }
});

module.exports = router; 