import { Router, Request, Response } from 'express';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { logger } from '../../utils/logger';
import { validateAddressByChain } from '../../utils/validation';
import { ErrorHandler } from '../../utils/errorHandler';

const router = Router();

interface SuiHolding {
  coinType: string;
  balance: string;
  objectId: string;
  objectCount: number;
}

// SUI holdings endpoint
router.post('/holdings', async (req: Request, res: Response) => {
  const { address, forceRefresh } = req.body;

  try {
    // Validate request parameters
    if (!address) {
      logger.error('Missing address parameter');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing address parameter' 
      });
    }

    // Validate SUI address format
    const addressError = validateAddressByChain(address, 'SUI');
    if (addressError) {
      logger.error('Invalid address format', { address });
      return res.status(400).json({ 
        success: false, 
        error: addressError 
      });
    }

    // Initialize Sui client
    const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

    // Fetch balances using SUI SDK
    const balances = await client.getAllBalances({ owner: address });

    // Transform balances into holdings format
    const holdings: SuiHolding[] = balances.map(balance => ({
      coinType: balance.coinType,
      balance: balance.totalBalance,
      objectId: '', // Not available in getAllBalances
      objectCount: 1 // Not available in getAllBalances
    }));

    // Log the response for debugging
    logger.info('Successfully fetched SUI holdings', { 
      address,
      holdingsCount: holdings.length,
      holdings: holdings.map(h => ({
        coinType: h.coinType,
        balance: h.balance
      }))
    });

    return res.json({
      success: true,
      data: { holdings },
      metadata: {
        duration: 0, // TODO: Add timing
        timestamp: new Date().toISOString(),
        service: 'evarra-backend-service'
      }
    });

  } catch (error) {
    logger.error('Error fetching SUI holdings', {
      address,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch holdings'
    });
  }
});

export default router; 