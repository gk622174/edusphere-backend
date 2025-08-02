const redis = require("redis");

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.log("Redis Connection Failed", err);
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis Connect Successfully");
  } catch (err) {
    console.log("Failed To Connect Redis", err);
  }
};

module.exports = { redisClient, connectRedis };
