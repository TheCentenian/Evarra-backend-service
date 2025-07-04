/**
 * Wallet Service Types
 * 
 * Defines interfaces and types for the wallet data service.
 * Enables easy MVP → backend migration through interface-based design.
 */

// Service Interface for MVP → Backend Migration
export interface IWalletDataService {
  // Core operations
  fetchWalletData(address: string, chain: string, options?: FetchWalletDataOptions): Promise<FetchWalletDataResult>;
  refreshWalletData(address: string, chain: string): Promise<FetchWalletDataResult>;
  invalidateWalletData(address: string): boolean;
  
  // Monitoring and health
  getServiceMetrics(): ServiceMetrics;
  getCacheStats(): CacheStats;
  getErrorLog(): ErrorLog[];
  checkHealth(): Promise<ServiceHealth>;
  
  // Service management
  getConfig(): ServiceConfig;
  updateConfig(config: Partial<ServiceConfig>): void;
}

// Service configuration
export interface ServiceConfig {
  name: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableMonitoring?: boolean;
  enableHealthChecks?: boolean;
}

// Fetch options
export interface FetchWalletDataOptions {
  forceRefresh?: boolean;
  timeout?: number;
}

// Fetch result
export interface FetchWalletDataResult {
  success: boolean;
  data?: any; // WalletData type will be defined separately
  error?: string;
  fromCache?: boolean;
  metadata?: {
    duration: number;
    timestamp: string;
    service: string;
  };
}

// Service metrics for monitoring
export interface ServiceMetrics {
  cacheHits: number;
  cacheMisses: number;
  apiCalls: number;
  errors: number;
  averageResponseTime: number;
  lastUpdated: Date;
  errorBreakdown: Record<string, number>; // Error types and counts
  chainBreakdown: Record<string, number>; // Calls per chain
}

// Cache statistics
export interface CacheStats {
  totalEntries: number;
  totalSize: number; // in bytes
  hitRate: number; // percentage
  missRate: number; // percentage
  lastCleared: Date;
  chains: Record<string, number>; // entries per chain
}

// Error log entry
export interface ErrorLog {
  timestamp: Date;
  service: string;
  operation: string;
  error: string;
  context: {
    address?: string;
    chain?: string;
    cacheKey?: string;
    fallbackAttempted?: boolean;
    apiResponse?: any;
  };
  stack?: string;
}

// Service health status
export interface ServiceHealth {
  isHealthy: boolean;
  lastCheck: Date;
  errorCount: number;
  averageResponseTime: number;
  cacheHitRate: number;
  supportedChains: string[];
  issues: string[];
}

// Health check result
export interface HealthCheckResult {
  success: boolean;
  duration: number;
  error?: string;
  details?: {
    cacheTest?: boolean;
    apiTest?: boolean;
    chainSupport?: string[];
  };
} 