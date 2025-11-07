import { createClient } from 'redis';

// Use globalThis (global in Node.js) to ensure singleton across Next.js serverless functions
const globalForRedis = globalThis;

// Circuit breaker - disable Redis if too many connection attempts fail
const MAX_CONNECTION_ATTEMPTS = 3;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 60 seconds

// Singleton Redis client - create once and reuse
let client = globalForRedis.redisClient;

// Circuit breaker state
let circuitBreakerEnabled = globalForRedis.redisCircuitBreakerEnabled || false;
let circuitBreakerTime = globalForRedis.redisCircuitBreakerTime || 0;
let connectionAttempts = globalForRedis.redisConnectionAttempts || 0;

// Check circuit breaker BEFORE creating client
if (circuitBreakerEnabled) {
  const timeSinceBreaker = Date.now() - circuitBreakerTime;
  if (timeSinceBreaker < CIRCUIT_BREAKER_TIMEOUT) {
    // Circuit breaker is active - DON'T CREATE CLIENT
    const remainingTime = Math.ceil((CIRCUIT_BREAKER_TIMEOUT - timeSinceBreaker) / 1000);
    console.warn(`🚨 Redis Circuit Breaker ACTIVE: Skipping client creation (${remainingTime}s remaining)`);
  } else {
    // Circuit breaker expired - reset it
    circuitBreakerEnabled = false;
    circuitBreakerTime = 0;
    connectionAttempts = 0;
    globalForRedis.redisCircuitBreakerEnabled = false;
    globalForRedis.redisCircuitBreakerTime = 0;
    globalForRedis.redisConnectionAttempts = 0;
    console.log('✅ Redis Circuit Breaker: Timeout expired, allowing client creation');
  }
}

// Create client ONLY if it doesn't exist and circuit breaker is not active
if (!client && !circuitBreakerEnabled) {
  try {
    // Create Redis client with connection URL if available, otherwise use socket config
    const redisUrl = process.env.REDIS_URL;
    
    if (redisUrl) {
      client = createClient({
        url: redisUrl
      });
    } else {
      client = createClient({
        username: 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
          reconnectStrategy: false // Disable automatic reconnection to prevent connection spam
        }
      });
    }

    // Error handler - DO NOT close client here, just log and enable circuit breaker
    client.on('error', err => {
      // Track connection errors
      if (err.message?.includes('max number of clients') || err.message?.includes('ERR max number of clients')) {
        connectionAttempts++;
        globalForRedis.redisConnectionAttempts = connectionAttempts;
        
        // IMMEDIATELY enable circuit breaker on max clients error
        circuitBreakerEnabled = true;
        circuitBreakerTime = Date.now();
        globalForRedis.redisCircuitBreakerEnabled = true;
        globalForRedis.redisCircuitBreakerTime = circuitBreakerTime;
        console.error('🚨 Redis Circuit Breaker: Max clients error detected. Redis disabled for 60 seconds.');
        
        // DO NOT call quit() here - we want to reuse the client when circuit breaker resets
        // The client will be reused when circuit breaker expires
      }
      
      // Only log errors that aren't connection-related during shutdown
      if (!err.message?.includes('Connection is closed') && 
          !err.message?.includes('Socket closed') && 
          !err.message?.includes('max number of clients')) {
        console.error('Redis Client Error:', err.message || err);
      }
    });

    client.on('connect', () => {
      console.log('Redis: Connecting...');
      // Reset connection attempts on successful connection
      connectionAttempts = 0;
      globalForRedis.redisConnectionAttempts = 0;
    });

    client.on('ready', () => {
      console.log('Redis: Ready');
      // Reset connection attempts and circuit breaker on ready
      connectionAttempts = 0;
      circuitBreakerEnabled = false;
      globalForRedis.redisConnectionAttempts = 0;
      globalForRedis.redisCircuitBreakerEnabled = false;
    });

    // Store globally to prevent multiple instances - SINGLETON PATTERN
    globalForRedis.redisClient = client;
    
    // Connect immediately - create once and reuse
    client.connect().catch(err => {
      // Connection errors are handled by the error event handler
      console.error('Redis initial connection error:', err.message);
    });
    
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    circuitBreakerEnabled = true;
    circuitBreakerTime = Date.now();
    globalForRedis.redisCircuitBreakerEnabled = true;
    globalForRedis.redisCircuitBreakerTime = circuitBreakerTime;
    client = null;
    globalForRedis.redisClient = null;
  }
}

// Export the singleton client
client = globalForRedis.redisClient;

// Connection helper - checks if client is ready, but doesn't create new connections
// The client is already connected when created (see above)
export async function connectRedis() {
  // Check circuit breaker first
  circuitBreakerEnabled = globalForRedis.redisCircuitBreakerEnabled || false;
  circuitBreakerTime = globalForRedis.redisCircuitBreakerTime || 0;
  
  if (circuitBreakerEnabled) {
    const timeSinceBreaker = Date.now() - circuitBreakerTime;
    if (timeSinceBreaker < CIRCUIT_BREAKER_TIMEOUT) {
      // Circuit breaker is active - don't attempt connection
      const remainingTime = Math.ceil((CIRCUIT_BREAKER_TIMEOUT - timeSinceBreaker) / 1000);
      console.warn(`🚨 Redis Circuit Breaker: Skipping connection (${remainingTime}s remaining)`);
      return;
    } else {
      // Circuit breaker timeout expired - reset it
      circuitBreakerEnabled = false;
      circuitBreakerTime = 0;
      connectionAttempts = 0;
      globalForRedis.redisCircuitBreakerEnabled = false;
      globalForRedis.redisCircuitBreakerTime = 0;
      globalForRedis.redisConnectionAttempts = 0;
      console.log('✅ Redis Circuit Breaker: Timeout expired, resuming connections');
    }
  }

  // Get the singleton client
  const redisClient = globalForRedis.redisClient;
  
  if (!redisClient) {
    console.warn('Redis client not initialized');
    return;
  }

  // Client is already connected when created - just check if it's ready
  // If not ready, wait for it (but don't call connect() again)
  if (redisClient.isReady) {
    return;
  }
  
  // If client exists but not ready, wait a bit for it to connect
  // Don't call connect() again as it's already connecting
  try {
    // Wait up to 2 seconds for connection
    let attempts = 0;
    while (!redisClient.isReady && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  } catch (error) {
    // Connection will be handled by error event handler
    return;
  }
}

// Disconnect from Redis - ONLY use when server is shutting down
// DO NOT call this after every request - the client should be reused
export async function disconnectRedis() {
  try {
    const redisClient = globalForRedis.redisClient;
    if (redisClient && redisClient.isReady) {
      await redisClient.quit(); // Use quit() for graceful shutdown
      globalForRedis.redisClient = null;
      console.log('Redis disconnected successfully');
    }
  } catch (error) {
    console.error('Failed to disconnect from Redis:', error);
    // Don't throw - this is cleanup
  }
}

// Check if Redis is connected
export function isRedisConnected() {
  // Check circuit breaker first
  circuitBreakerEnabled = globalForRedis.redisCircuitBreakerEnabled || false;
  circuitBreakerTime = globalForRedis.redisCircuitBreakerTime || 0;
  
  if (circuitBreakerEnabled) {
    const timeSinceBreaker = Date.now() - circuitBreakerTime;
    if (timeSinceBreaker < CIRCUIT_BREAKER_TIMEOUT) {
      return false; // Circuit breaker is active
    }
  }
  
  try {
    const redisClient = globalForRedis.redisClient;
    return redisClient && redisClient.isReady === true;
  } catch (error) {
    return false;
  }
}

// Basic Redis operations
export async function setKey(key, value, options = {}) {
  try {
    // Get the singleton client
    const redisClient = globalForRedis.redisClient;
    
    if (!redisClient) {
      console.warn('Redis client not initialized, skipping setKey operation');
      return false;
    }
    
    // Check if connected - client connects automatically when created
    if (!redisClient.isReady) {
      await connectRedis();
      // If still not ready after attempting, return false
      if (!redisClient.isReady) {
        console.warn('Redis not available, skipping setKey operation');
        return false;
      }
    }
    
    // Handle different TTL options
    if (options.ttl !== undefined) {
      if (options.ttl === -1) {
        // Infinite TTL - set without expiration
        await redisClient.set(key, JSON.stringify(value));
      } else if (options.ttl > 0) {
        // Set with TTL in seconds
        await redisClient.setEx(key, options.ttl, JSON.stringify(value));
      }
    } else if (options.expire) {
      // Legacy support for expire option
      await redisClient.setEx(key, options.expire, JSON.stringify(value));
    } else {
      // Default: no expiration
      await redisClient.set(key, JSON.stringify(value));
    }
    
    return true;
  } catch (error) {
    // Don't throw - just log and return false
    // This prevents API routes from crashing when Redis has issues
    console.error('Error setting Redis key:', error.message || error);
    return false;
  }
}

export async function getKey(key) {
  try {
    // Get the singleton client
    const redisClient = globalForRedis.redisClient;
    
    if (!redisClient) {
      console.warn('Redis client not initialized, returning null for getKey');
      return null;
    }
    
    // Check if connected - client connects automatically when created
    if (!redisClient.isReady) {
      await connectRedis();
      // If still not ready after attempting, return null
      if (!redisClient.isReady) {
        console.warn('Redis not available, returning null for getKey');
        return null;
      }
    }
    
    const result = await redisClient.get(key);
    return result ? JSON.parse(result) : null;
  } catch (error) {
    // Don't throw - just log and return null
    // This prevents API routes from crashing when Redis has issues
    console.error('Error getting Redis key:', error.message || error);
    return null;
  }
}

// Delete a key from Redis
export async function deleteKey(key) {
  try {
    // Get the singleton client
    const redisClient = globalForRedis.redisClient;
    
    if (!redisClient) {
      console.warn('Redis client not initialized, skipping deleteKey operation');
      return false;
    }
    
    // Check if connected - client connects automatically when created
    if (!redisClient.isReady) {
      await connectRedis();
      // If still not ready after attempting, return false
      if (!redisClient.isReady) {
        console.warn('Redis not available, skipping deleteKey operation');
        return false;
      }
    }
    
    await redisClient.del(key);
    return true;
  } catch (error) {
    // Don't throw - just log and return false
    // This prevents API routes from crashing when Redis has issues
    console.error('Error deleting Redis key:', error.message || error);
    return false;
  }
}

// Export the singleton client for advanced operations
export { client };

// Export default for convenience
export default client;
