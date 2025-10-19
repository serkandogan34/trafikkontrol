/**
 * API Server
 * 
 * Main Express server for the Traffic Management Platform API
 * Phase 3: API LAYER
 */

import express from 'express';
import { getInstance as getDatabase } from '../database/sqlite/connection.js';
import {
  DomainController,
  TrafficController,
  AnalyticsController,
  BotDetectionController,
  HealthController
} from './controllers/index.js';
import {
  errorHandler,
  notFoundHandler,
  createRateLimiter,
  requestLogger,
  cors
} from './middleware/index.js';
import createApiRouter from './routes/index.js';

class APIServer {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.app = express();
    this.db = null;
    this.controllers = {};
  }

  /**
   * Initialize database connection
   */
  initDatabase() {
    console.log('🔌 Initializing database connection...');
    const dbConnection = getDatabase();
    dbConnection.connect();
    this.db = dbConnection.getDB();
    console.log('✅ Database connected');
  }

  /**
   * Initialize controllers
   */
  initControllers() {
    console.log('🎮 Initializing controllers...');
    this.controllers = {
      domainController: new DomainController(this.db),
      trafficController: new TrafficController(this.db),
      analyticsController: new AnalyticsController(this.db),
      botDetectionController: new BotDetectionController(this.db),
      healthController: new HealthController(this.db)
    };
    console.log('✅ Controllers initialized');
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    console.log('🔧 Setting up middleware...');

    // CORS
    this.app.use(cors({
      origin: '*',
      credentials: false
    }));

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logger
    this.app.use(requestLogger);

    // Rate limiter (100 requests per minute)
    this.app.use('/api', createRateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      message: 'Too many requests from this IP, please try again later'
    }));

    console.log('✅ Middleware configured');
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    console.log('🛣️  Setting up routes...');

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Traffic Management Platform API',
        version: '1.0.0',
        documentation: '/api/v1/health'
      });
    });

    // API v1 routes
    const apiRouter = createApiRouter(this.controllers);
    this.app.use('/api/v1', apiRouter);

    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler (must be last)
    this.app.use(errorHandler);

    console.log('✅ Routes configured');
  }

  /**
   * Start server
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        // Initialize components
        this.initDatabase();
        this.initControllers();
        this.setupMiddleware();
        this.setupRoutes();

        // Start listening
        this.server = this.app.listen(this.port, () => {
          console.log('\n' + '='.repeat(60));
          console.log('🚀 Traffic Management Platform API Server');
          console.log('='.repeat(60));
          console.log(`📍 Server running on: http://localhost:${this.port}`);
          console.log(`📍 API Base URL: http://localhost:${this.port}/api/v1`);
          console.log(`📍 Health Check: http://localhost:${this.port}/api/v1/health`);
          console.log('='.repeat(60) + '\n');
          resolve(this.server);
        });

        this.server.on('error', (error) => {
          console.error('❌ Server error:', error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ Failed to start server:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('✅ Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new APIServer({ port: 3001 });
  
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n⚠️  Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n⚠️  Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
}

export default APIServer;
