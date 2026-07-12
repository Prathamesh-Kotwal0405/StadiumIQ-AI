import app from './app';
import { connectDB, sequelize } from './config/db.config';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Connect to SQLite Database
    await connectDB();

    // In development mode, synchronize schemas automatically
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
      console.log('Database tables verified and synchronized.');
    }

    const server = app.listen(PORT, () => {
      console.log(`[StadiumIQ Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });

    // Graceful Shutdown Mechanics
    const handleShutdown = async () => {
      console.log('\nReceived shutdown signal. Stopping services...');
      server.close(async () => {
        console.log('HTTP Server terminated.');
        await sequelize.close();
        console.log('Database connection closed safely.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);

  } catch (error) {
    console.error('Server failed to initialize:', error);
    process.exit(1);
  }
};

startServer();
