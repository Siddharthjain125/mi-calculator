import express from 'express';
import { calculateMiHandler } from './controllers/mi.controller';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.post('/api/calculate-mi', calculateMiHandler);
  app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

  return app;
}
