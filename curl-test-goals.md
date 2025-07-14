# Goals API - Curl Testing Commands

## Prerequisites
- Backend server running on HTTPS (localhost:3000)
- MongoDB Atlas connected
- Test user created

## Test User Creation
```bash
# Create a test user first
curl.exe -k -X POST https://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

## Goals API Endpoints

### 1. Create Goal
```bash
# Replace USER_ID with the actual user ID from registration
curl.exe -k -X POST https://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "name": "Save 1000 SUI",
    "description": "Save up 1000 SUI tokens",
    "status": "active",
    "progress": 25,
    "coin": "Sui",
    "coin_symbol": "SUI",
    "current_amount": 250,
    "target_amount": 1000,
    "target_date": null,
    "wallet_id": null,
    "wallet_address": null,
    "wallet_chain": null,
    "goal_type": "regular",
    "parent_goal_id": null,
    "is_aggregate": false,
    "milestones": [],
    "notes": "Save up 1000 SUI tokens"
  }'
```

### 2. Get Goal by ID
```bash
# Replace GOAL_ID with the actual goal ID from creation
curl.exe -k -X GET https://localhost:3000/api/goals/GOAL_ID
```

### 3. Get User Goals
```bash
# Replace USER_ID with the actual user ID
curl.exe -k -X GET https://localhost:3000/api/goals/user/USER_ID
```

### 4. Update Goal
```bash
# Replace GOAL_ID with the actual goal ID
curl.exe -k -X PUT https://localhost:3000/api/goals/GOAL_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Save 1500 SUI (Updated)",
    "current_amount": 500
  }'
```

### 5. Get Goal Progress
```bash
# Replace GOAL_ID with the actual goal ID
curl.exe -k -X GET https://localhost:3000/api/goals/GOAL_ID/progress
```

### 6. Update Goal Progress
```bash
# Replace GOAL_ID with the actual goal ID
curl.exe -k -X PUT https://localhost:3000/api/goals/GOAL_ID/progress \
  -H "Content-Type: application/json" \
  -d '{
    "current_amount": 750
  }'
```

### 7. Delete Goal
```bash
# Replace GOAL_ID with the actual goal ID
curl.exe -k -X DELETE https://localhost:3000/api/goals/GOAL_ID
```

### 8. Get All Goals (Admin)
```bash
curl.exe -k -X GET https://localhost:3000/api/goals
```

### 9. Goals Health Check
```bash
curl.exe -k -X GET https://localhost:3000/api/goals/health
```

## Error Testing

### Invalid Goal ID
```bash
curl.exe -k -X GET https://localhost:3000/api/goals/invalid-id
```

### Missing Required Fields
```bash
curl.exe -k -X POST https://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "name": "Invalid Goal"
  }'
```

### Invalid Goal Type
```bash
curl.exe -k -X POST https://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "name": "Invalid Goal",
    "coin": "Sui",
    "coin_symbol": "SUI",
    "current_amount": 100,
    "target_amount": 1000,
    "goal_type": "invalid_type"
  }'
```



### Current Amount Exceeds Target
```bash
curl.exe -k -X POST https://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "name": "Invalid Amount Goal",
    "coin": "Sui",
    "coin_symbol": "SUI",
    "current_amount": 2000,
    "target_amount": 1000,
    "goal_type": "savings"
  }'
```

## Expected Responses

### Successful Goal Creation
```json
{
  "success": true,
  "data": {
    "id": "GOAL_ID",
    "user_id": "USER_ID",
    "name": "Save 1000 SUI",
    "description": "Save up 1000 SUI tokens",
    "status": "active",
    "progress": 25,
    "coin": "Sui",
    "coin_symbol": "SUI",
    "current_amount": 250,
    "target_amount": 1000,
    "target_date": null,
    "wallet_id": null,
    "wallet_address": null,
    "wallet_chain": null,
    "goal_type": "regular",
    "parent_goal_id": null,
    "is_aggregate": false,
    "milestones": [],
    "notes": "Save up 1000 SUI tokens",
    "progress_percentage": 25,
    "created_at": "2025-01-XX...",
    "updated_at": "2025-01-XX..."
  },
  "message": "Goal created successfully"
}
```

### Goal Progress
```json
{
  "success": true,
  "data": {
    "current_amount": 750,
    "target_amount": 1000,
    "progress_percentage": 75,
    "remaining_amount": 250,
    "is_completed": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation failed: Goal name is required, Coin is required"
}
```

## Testing Notes

1. **Replace IDs**: Always replace `USER_ID` and `GOAL_ID` with actual values from previous responses
2. **HTTPS**: Use `-k` flag to ignore self-signed certificate warnings
3. **Windows**: Use `curl.exe` instead of `curl` on Windows
4. **Content-Type**: Always include the Content-Type header for POST/PUT requests
5. **Error Handling**: Test error scenarios to ensure proper validation
6. **Goal Types**: Must be one of: regular, parent, subgoal 