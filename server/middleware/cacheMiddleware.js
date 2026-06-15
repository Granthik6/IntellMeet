const { cacheGet, cacheSet } = require("../config/redis");

/**
 * Express middleware for Redis caching
 * Caches GET responses with configurable key prefix and TTL
 */
const cacheMiddleware = (keyPrefix, ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Build cache key from prefix + user ID + query params
    const userId = req.user?.id || "anonymous";
    const queryString = JSON.stringify(req.query);
    const paramString = JSON.stringify(req.params);
    const cacheKey = `${keyPrefix}:${userId}:${paramString}:${queryString}`;

    try {
      // Check cache
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json to cache the response
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheSet(cacheKey, body, ttlSeconds).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch {
      // If caching fails, just proceed without cache
      next();
    }
  };
};

module.exports = cacheMiddleware;
