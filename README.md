# Evarra Backend Service

Backend service for Evarra Tracker, providing SUI blockchain API endpoints.

## 🚀 Features

- **SUI Holdings Endpoint**: Fetch wallet holdings using SUI SDK
- **SUI Transactions Endpoint**: Fetch wallet transactions using SUI SDK
- **SUI Metadata Endpoint**: Fetch token metadata using SUI SDK
- **MongoDB Cache System**: Aggressive caching for 80-90% API reduction
- **Authentication System**: User registration, login, and session management
- **Goals Management**: CRUD operations for user goals
- **Wallets Management**: CRUD operations for user wallets
- **Health Check**: Service health monitoring
- **CORS Support**: Cross-origin request handling
- **Error Handling**: Comprehensive error logging and responses
- **Validation**: Input validation for blockchain addresses

## 📋 Prerequisites

- Node.js 18+ 
- npm

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd evarra-backend-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file:
   ```bash
   PORT=3000
   CORS_ORIGIN=http://localhost:3000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/evarra
   MONGODB_DATABASE=evarra
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🏃‍♂️ Running the Service

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "evarra-backend-service",
  "timestamp": "2025-07-04T14:19:24.924Z",
  "version": "1.0.0"
}
```

### SUI Holdings
```
POST /api/sui/holdings
```

**Request Body:**
```json
{
  "address": "0x1234567890123456789012345678901234567890123456789012345678901234",
  "forceRefresh": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "holdings": [
      {
        "coinType": "0x2::sui::SUI",
        "balance": "100000000",
        "objectId": "",
        "objectCount": 1
      }
    ]
  },
  "metadata": {
    "duration": 0,
    "timestamp": "2025-07-04T14:19:24.924Z",
    "service": "evarra-backend-service"
  }
}
```

### Cache Endpoints

#### Wallet Data Cache
```
GET /api/cache/wallet-data?walletId=ID&dataType=holdings
POST /api/cache/wallet-data
DELETE /api/cache/wallet-data?walletId=ID
```

#### Metadata Cache
```
GET /api/cache/metadata?coinType=TYPE
POST /api/cache/metadata
PUT /api/cache/metadata
```

#### Cache Statistics
```
GET /api/cache/stats
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB Atlas connection string | Required |
| `MONGODB_DATABASE` | MongoDB database name | `evarra` |

## 🚀 Deployment

### Render (Recommended)

1. **Connect to GitHub**
   - Push this repository to GitHub
   - Connect your GitHub repository to Render

2. **Environment Variables**
   - Set `PORT` (Render will provide this)
   - Set `CORS_ORIGIN` to your frontend domain

3. **Build Settings**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

## 📊 Migration Status

This backend service is part of the **Phase 1** migration from Cloudflare Pages workers to a consolidated backend service.

### ✅ Completed
- [x] SUI holdings endpoint
- [x] SUI transactions endpoint
- [x] SUI metadata endpoint
- [x] MongoDB cache system
- [x] Authentication system
- [x] Goals management
- [x] Wallets management
- [x] Health check endpoint
- [x] Error handling
- [x] Input validation
- [x] Logging system
- [x] Cache endpoints
- [x] Cache statistics

### 🔄 In Progress
- [ ] Deploy to Render
- [ ] Test with real SUI addresses
- [ ] Compare with existing worker response

### 📋 Planned
- [ ] Cache-first strategy for SUI endpoints
- [ ] Advanced cache monitoring
- [ ] Cache performance optimization

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in .env file
   PORT=3001
   ```

2. **CORS errors**
   ```bash
   # Update CORS_ORIGIN in .env file
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. **SUI SDK connection issues**
   - Check internet connection
   - Verify SUI mainnet is accessible

## 📝 License

ISC License 