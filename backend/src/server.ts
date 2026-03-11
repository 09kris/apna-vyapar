import sequelize, { testConnection, syncDatabase } from './config/database';
import app from './app';
import dotenv from 'dotenv';
import socketService from './socket/socketService';

dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Global error handlers to catch unhandled errors and prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function startServer() {
  try {
    // Test database connection
    await testConnection();

    // Sync database (create tables if they don't exist)
    const forceSync = process.env.FORCE_SYNC === 'true';
    await syncDatabase(forceSync, false); // Only create tables, don't alter

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║  🚀 Apna Vyapar Server Started             ║
║  Environment: ${NODE_ENV.padEnd(35)}║
║  Port: ${String(PORT).padEnd(40)}║
║  Time: ${new Date().toLocaleString().padEnd(33)}║
╚════════════════════════════════════════════╝
      `);
    });

    // Initialize Socket.io
    socketService.initialize(server);
    console.log('🔌 Socket.io service initialized');

    // Keep server alive - log periodically to ensure event loop is active
    const keepAliveInterval = setInterval(() => {
      console.log('✅ Server is running and listening on port', PORT);
    }, 30000); // Log every 30 seconds

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n📌 SIGTERM signal received: closing HTTP server');
      clearInterval(keepAliveInterval);
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('\n📌 SIGINT signal received: closing HTTP server');
      clearInterval(keepAliveInterval);
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

