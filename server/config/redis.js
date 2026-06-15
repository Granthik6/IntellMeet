const Redis = require("ioredis");

let redisClient = null;
let isRedisConnected = false;

const initRedis = () => {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.log("⚠️  Redis: Max retries reached, running without cache");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
      console.log("✅ Redis Connected");
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
      console.log("⚠️  Redis Error:", err.message);
    });

    redisClient.on("close", () => {
      isRedisConnected = false;
    });

    // Attempt connection
    redisClient.connect().catch(() => {
      console.log("⚠️  Redis: Could not connect, running without cache");
    });
  } catch (err) {
    console.log("⚠️  Redis: Init failed, running without cache —", err.message);
  }
};

const getRedisClient = () => redisClient;
const isRedisAvailable = () => isRedisConnected && redisClient !== null;

// Cache helpers
const cacheGet = async (key) => {
  if (!isRedisAvailable()) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (!isRedisAvailable()) return;
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Silent fail
  }
};

const cacheDel = async (pattern) => {
  if (!isRedisAvailable()) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch {
    // Silent fail
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  isRedisAvailable,
  cacheGet,
  cacheSet,
  cacheDel,
};
