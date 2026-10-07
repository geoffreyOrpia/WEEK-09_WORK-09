import express from 'express';
import cors from 'cors';
import { timingSafeEqual } from 'node:crypto';
import { createControllers } from './controllers.js';
import { httpError } from './validation.js';

export const createApp = ({ repository, allowedOrigins = [], apiToken = '' }) => {
  const app = express();
  app.disable('x-powered-by');
  const checkOrigin = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(httpError(403, 'This web origin is not allowed.'));
  };
  app.use(cors({ origin: checkOrigin, methods: ['GET', 'POST', 'PATCH', 'DELETE'] }));
  app.use(express.json({ limit: '16kb' }));

  const authorize = (req, res, next) => {
    if (!apiToken) { next(); return; }
    const actual = Buffer.from(req.get('authorization') ?? '');
    const expected = Buffer.from(`Bearer ${apiToken}`);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      next(httpError(401, 'A valid API token is required.'));
      return;
    }
    next();
  };
  app.use(authorize);
  const handlers = createControllers(repository);
  app.get('/gateway', handlers.getGateway);
  app.get('/devices', handlers.getDevices);
  app.post('/devices', handlers.addDevice);
  app.patch('/devices/:id', handlers.updateDevice);
  app.delete('/devices/:id', handlers.removeDevice);
  app.get('/sensors', handlers.getSensors);
  app.post('/sensors', handlers.addSensors);
  app.get('/preferences', handlers.getPreferences);
  app.patch('/preferences', handlers.updatePreferences);
  const notFound = (req, res, next) => next(httpError(404, 'Route not found.'));
  const handleError = (error, req, res, next) => {
    if (res.headersSent) { next(error); return; }
    const status = error.type === 'entity.parse.failed' ? 400 : error.status ?? 503;
    const message = status >= 500 ? 'The database is unavailable. Please try again.'
      : error.type === 'entity.parse.failed' ? 'Send valid JSON.' : error.message;
    res.status(status).json({ message });
  };
  app.use(notFound);
  app.use(handleError);
  return app;
};
