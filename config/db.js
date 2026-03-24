const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

const connectDB = async () => {
  const useMemoryFallback = process.env.USE_IN_MEMORY_FALLBACK === "true";

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Primary MongoDB connection failed:", error.message);

    if (!useMemoryFallback) {
      process.exit(1);
    }

    try {
      await mongoose.disconnect();

      memoryServer = await MongoMemoryServer.create();
      const memoryUri = memoryServer.getUri("ecommerce_dev");

      const conn = await mongoose.connect(memoryUri, {
        serverSelectionTimeoutMS: 5000,
      });

      console.log(`Connected to in-memory MongoDB: ${conn.connection.host}`);
    } catch (memoryError) {
      console.error("In-memory MongoDB fallback failed:", memoryError.message);
      process.exit(1);
    }
  }
};

process.on("SIGINT", async () => {
  if (memoryServer) {
    await memoryServer.stop();
  }
  process.exit(0);
});

module.exports = connectDB;