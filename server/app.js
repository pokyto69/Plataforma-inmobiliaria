import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { getConfig } from './config/env.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { apiLimiter } from './middleware/security.js';
import { apiRoutes } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

export function createApp() {
  const config = getConfig();
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", 'https://maps.googleapis.com', 'https://maps.gstatic.com'],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              imgSrc: [
                "'self'",
                'data:',
                'https://images.unsplash.com',
                'https://maps.googleapis.com',
                'https://maps.gstatic.com',
              ],
              connectSrc: ["'self'", 'https://maps.googleapis.com', 'https://maps.gstatic.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Origen no permitido por CORS.'));
      },
      credentials: true,
    }),
  );

  const uploadsPath = process.env.USER_PROPERTIES_PATH
    ? path.join(path.dirname(path.resolve(process.env.USER_PROPERTIES_PATH)), 'uploads')
    : path.resolve(__dirname, 'data/uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/api/uploads', express.static(uploadsPath));

  app.use('/api', apiLimiter, apiRoutes);

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath, { maxAge: config.isProduction ? '1h' : 0 }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
