import 'dotenv/config'; 

import app from './app';
import prisma from './lib/prisma/client';
import { env } from './config/env';
import { logger } from './utils/logger';

const PORT = env.PORT; 

async function startServer() {
    try {
        // 1. Connect to the Database using the Singleton Prisma Client
        // This attempts to connect using the Pooler URL (DATABASE_URL)
        await prisma.$connect();
        console.log('✅ Database connected successfully! (via Prisma/pg adapter)');

        // 2. Start the HTTP Server
        // The app instance is now listening for incoming HTTP requests
        app.listen(PORT, () => {
            console.log(`🚀 Server listening on port: ${PORT}`);
            console.log(`🔗 API URL: http://localhost:${PORT}`);
        });

    } catch (error) {
        // Handle connection or server startup errors
        logger.error('❌ Failed to start server or connect to database:', error);
        
        // 3. Ensure the database connection is closed if startup fails
        await prisma.$disconnect();

        // Exit process with failure code (1)
        process.exit(1);
    }
}

// Start the whole application
startServer();

// --- Graceful Shutdown ---
// This ensures the database connection is cleanly closed if the process is terminated 
// (e.g., Ctrl+C in the terminal, or a termination signal from a container orchestrator).
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.log('\n🛑 Server closed and database connection disconnected.');
    process.exit(0);
});