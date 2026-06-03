import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './utils/seeder.js';
import { connectCloudinary } from './config/cloudinary.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('✅ MongoDB connected successfully');

    // Connect to Cloudinary
    connectCloudinary();
    logger.info('✅ Cloudinary configured');

    // Seed initial data (admin + categories) on first run
    if (process.env.SEED_DB === 'true') {
      await seedDatabase();
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`📡 API: http://localhost:${PORT}/api/v1`);
      logger.info(`❤️  Health: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.error(`❌ Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! 💥 Shutting down...`);
  logger.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
  logger.error(err.name, err.message);
  process.exit(1);
});

startServer();
