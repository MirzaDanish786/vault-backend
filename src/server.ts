import 'dotenv/config'; 

import app from './app.js';
import { env } from '@/config/env';
import prisma from '@/lib/prisma/client';
import { logger } from '@/utils/logger';
import { swaggerDocs } from './docs';

const PORT = env.PORT; 

async function startServer() {
    try {
        await prisma.$connect();
        console.log(' Database connected successfully! (via Prisma/pg adapter)');

        app.listen(PORT, () => {
          swaggerDocs(app, PORT);

            console.log(` Server listening on port: ${PORT}`);
            console.log(` API URL: http://localhost:${PORT}`);
        });

    } catch (error) {
        logger.error(' Failed to start server or connect to database:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

startServer();

const gracefulShutdown = async (signal: string) => {
  try {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    await prisma.$disconnect();
    console.log("Database disconnected successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
