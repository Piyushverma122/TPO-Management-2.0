const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const logger = require('./utils/logger');
const apiRouter = require('./routes');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');

const app = express();

// Security HTTP Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      // Allow localhost on any port during development
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      if (origin === env.clientUrl) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Root Route Welcome Message
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Smart Placement & TPO Management System API 2.0',
    version: '1.0.0',
    healthCheck: '/api/v1/health',
  });
});

// Mount Main API v1 Router
app.use('/api/v1', apiRouter);

// 404 Route Catch-all
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

// Start Express Server
const PORT = env.port;
const server = app.listen(PORT, () => {
  logger.info(`🚀 TPO Portal Backend API running on port ${PORT} [${env.nodeEnv.toUpperCase()}]`);
  logger.info(`🔗 Health Check URL: http://localhost:${PORT}/api/v1/health`);
});

// Handle Unhandled Rejections & Exceptions
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err.message || err);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message || err);
});

module.exports = app;
