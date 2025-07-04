# Evarra Backend Service

Backend service for Evarra Tracker, providing SUI blockchain API endpoints.

## 🚀 Features

- **SUI Holdings Endpoint**: Fetch wallet holdings using SUI SDK
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

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

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
- [x] Health check endpoint
- [x] Error handling
- [x] Input validation
- [x] Logging system

### 🔄 In Progress
- [ ] Deploy to Render
- [ ] Test with real SUI addresses
- [ ] Compare with existing worker response

### 📋 Planned
- [ ] SUI transactions endpoint
- [ ] SUI metadata endpoint
- [ ] Authentication system
- [ ] Database integration

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