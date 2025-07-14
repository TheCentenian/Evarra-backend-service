# Wallet API Curl Tests

This document provides curl commands to test the wallet endpoints manually.

## Prerequisites

- Backend server running on HTTPS (localhost:3000)
- Self-signed certificate (use `-k` flag to ignore SSL warnings)
- MongoDB Atlas connected and working
- Valid user ID from the database

## Test User ID

Replace `YOUR_USER_ID` with a valid user ID from your MongoDB Atlas database.

## Health Check

```bash
curl -k -X GET https://localhost:3000/api/wallets/health
```

Expected response:
```json
{
  "success": true,
  "service": "wallets-service",
  "status": "healthy",
  "timestamp": "2025-01-XX..."
}
```

## Create Wallet Tests

### 1. Create SUI Wallet (Valid)

```bash
curl -k -X POST https://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "address": "0x1234567890123456789012345678901234567890123456789012345678901234",
    "label": "My SUI Wallet",
    "chain": "sui"
  }'
```

### 2. Create Ethereum Wallet (Valid)

```bash
curl -k -X POST https://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "label": "My ETH Wallet",
    "chain": "ethereum"
  }'
```

### 3. Create Bitcoin Wallet (Valid)

```bash
curl -k -X POST https://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "label": "My BTC Wallet",
    "chain": "bitcoin"
  }'
```

### 4. Create Solana Wallet (Valid)

```bash
curl -k -X POST https://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "address": "11111111111111111111111111111112",
    "label": "My SOL Wallet",
    "chain": "solana"
  }'
```

### 5. Create Wallet - Missing Required Fields

```bash
curl -k -X POST https://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "address": "0x1234567890123456789012345678901234567890123456789012345678901234"
  }'
```

Expected: 400 Bad Request

### 6. Create Wallet - Invalid SUI Address

```bash
curl -k -X POST https://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "address": "0x123",
    "label": "Invalid Wallet",
    "chain": "sui"
  }'
```

Expected: 400 Bad Request

### 7. Create Wallet - Unsupported Chain

```bash
curl -k -X POST https://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "address": "0x1234567890123456789012345678901234567890123456789012345678901234",
    "label": "Invalid Chain Wallet",
    "chain": "invalid_chain"
  }'
```

Expected: 400 Bad Request

## Get Wallet Tests

### 8. Get User Wallets

```bash
curl -k -X GET https://localhost:3000/api/wallets/user/YOUR_USER_ID
```

### 9. Get Wallet by ID

Replace `WALLET_ID` with an actual wallet ID from your database.

```bash
curl -k -X GET https://localhost:3000/api/wallets/WALLET_ID
```

### 10. Get Wallet by Address and Chain

```bash
curl -k -X GET https://localhost:3000/api/wallets/user/YOUR_USER_ID/address/0x1234567890123456789012345678901234567890123456789012345678901234/chain/sui
```

### 11. Get Wallets by Chain

```bash
curl -k -X GET https://localhost:3000/api/wallets/user/YOUR_USER_ID/chain/sui
```

## Update Wallet Tests

### 12. Update Wallet Label

Replace `WALLET_ID` with an actual wallet ID.

```bash
curl -k -X PUT https://localhost:3000/api/wallets/WALLET_ID \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Updated Wallet Label"
  }'
```

### 13. Update Wallet Address

```bash
curl -k -X PUT https://localhost:3000/api/wallets/WALLET_ID \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x9876543210987654321098765432109876543210987654321098765432109876"
  }'
```

### 14. Update Wallet Chain

```bash
curl -k -X PUT https://localhost:3000/api/wallets/WALLET_ID \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "polygon"
  }'
```

### 15. Update Wallet - Invalid Address

```bash
curl -k -X PUT https://localhost:3000/api/wallets/WALLET_ID \
  -H "Content-Type: application/json" \
  -d '{
    "address": "invalid_address"
  }'
```

Expected: 400 Bad Request

### 16. Update Wallet - No Fields

```bash
curl -k -X PUT https://localhost:3000/api/wallets/WALLET_ID \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: 400 Bad Request

## Delete Wallet Tests

### 17. Delete Wallet

Replace `WALLET_ID` with an actual wallet ID.

```bash
curl -k -X DELETE https://localhost:3000/api/wallets/WALLET_ID
```

### 18. Delete Non-existent Wallet

```bash
curl -k -X DELETE https://localhost:3000/api/wallets/507f1f77bcf86cd799439999
```

Expected: 400 Bad Request

## Admin Tests

### 19. Get All Wallets

```bash
curl -k -X GET https://localhost:3000/api/wallets
```

## Expected Response Format

### Successful Create/Update Response

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "user_id": "507f1f77bcf86cd799439011",
    "address": "0x1234567890123456789012345678901234567890123456789012345678901234",
    "label": "My SUI Wallet",
    "chain": "sui",
    "created_at": "2025-01-XX...",
    "updated_at": "2025-01-XX..."
  },
  "message": "Wallet created successfully"
}
```

### Successful Get Response

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "user_id": "507f1f77bcf86cd799439011",
      "address": "0x1234567890123456789012345678901234567890123456789012345678901234",
      "label": "My SUI Wallet",
      "chain": "sui",
      "created_at": "2025-01-XX...",
      "updated_at": "2025-01-XX..."
    }
  ],
  "count": 1
}
```

### Error Response

```json
{
  "success": false,
  "error": "Validation failed: Wallet label is required"
}
```

## Testing Tips

1. **Get a valid user ID first**: Use the auth endpoints to create a user and get their ID
2. **Test validation**: Try invalid addresses, missing fields, unsupported chains
3. **Test duplicates**: Try creating the same wallet twice
4. **Test updates**: Create a wallet, then update its fields
5. **Test deletes**: Create a wallet, then delete it
6. **Check MongoDB**: Verify data appears in your Atlas database

## Common Issues

- **SSL Certificate**: Use `-k` flag to ignore self-signed certificate warnings
- **User ID**: Make sure you have a valid user ID from the database
- **Address Format**: Different chains have different address formats
- **Chain Names**: Use lowercase chain names (sui, ethereum, bitcoin, etc.) 