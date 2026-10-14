const mongoose = require('mongoose');
const config = require('./env');

let memServer = null;

/**
 * Connect to MongoDB database.
 * If local MongoDB instance is unreachable, gracefully fall back to an embedded
 * MongoMemoryServer instance and auto-seed demo data for immediate testing.
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 2500
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`Local MongoDB connection failed (${error.message}). Checking for in-memory fallback...`);

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      console.log('Starting embedded MongoMemoryServer fallback...');
      memServer = await MongoMemoryServer.create();
      const inMemoryUri = memServer.getUri();

      const conn = await mongoose.connect(inMemoryUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log(`Connected to embedded MongoDB at: ${inMemoryUri}`);

      // Auto-seed if database is freshly initialized
      const User = require('../models/User');
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('Seeding initial demo dataset into embedded database...');
        const runSeed = require('../seed/seed');
        await runSeed();
      }

      return conn;
    } catch (fallbackError) {
      console.error(`Embedded Mongo fallback failed: ${fallbackError.message}`);
      if (config.NODE_ENV !== 'test') {
        process.exit(1);
      }
      throw error;
    }
  }
};

process.on('SIGINT', async () => {
  if (memServer) {
    await memServer.stop();
  }
});

process.on('SIGTERM', async () => {
  if (memServer) {
    await memServer.stop();
  }
});

module.exports = connectDB;

