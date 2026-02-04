import sequelize, { testConnection, syncDatabase } from './config/database';
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // Test database connection
    await testConnection();

    // Sync database (create tables if they don't exist)
    const forceSync = process.env.FORCE_SYNC === 'true';
    await syncDatabase(forceSync);

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

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n📌 SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('\n📌 SIGINT signal received: closing HTTP server');
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
