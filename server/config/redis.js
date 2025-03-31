const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;

// Create Redis client with error handling and reconnection
const connectRedis = () => {
  try {
    // Check if Redis URL is provided
    if (!process.env.REDIS_URL) {
      logger.warn('Redis URL not provided. Caching will be disabled.');
      return null;
    }
    
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        logger.info(`Redis reconnecting in ${delay}ms...`);
        return delay;
      }
    });

    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    client.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    client.on('end', () => {
      logger.info('Redis client disconnected');
    });

    return client;
  } catch (error) {
    logger.error('Redis connection error:', error);
    return null;
  }
};

// Initialize Redis client
const getRedisClient = () => {
  if (!redisClient) {
    redisClient = connectRedis();
  }
  return redisClient;
};

module.exports = {
  getRedisClient
};

