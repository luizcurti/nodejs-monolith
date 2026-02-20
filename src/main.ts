import 'reflect-metadata';
import express from 'express';
import { config } from 'dotenv';
import sequelize from './infrastructure/database/sequelize.config';
import logger from './infrastructure/logging/logger';
import clientAdmRouter from './modules/client-adm/routes/client-adm.routes';
import productAdmRouter from './modules/product-adm/routes/product-adm.routes';
import storeCatalogRouter from './modules/store-catalog/routes/store-catalog.routes';
import paymentRouter from './modules/payment/routes/payment.routes';

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Module routes
app.use('/api/clients', clientAdmRouter);
app.use('/api/products', productAdmRouter);
app.use('/api/catalog/products', storeCatalogRouter);
app.use('/api/payments', paymentRouter);

// Database connection
const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    if (process.env.NODE_ENV !== 'test') {
      await sequelize.sync();
      logger.info('Database synchronized');
    }
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

// Start the application
if (require.main === module) {
  startServer();
}

export { app };
