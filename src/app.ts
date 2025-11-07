import express from 'express';
import { calculateMiHandler } from './controllers/mi.controller';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

export function createApp() {
  const app = express();
  app.use(express.json());

  // Load API docs
  const openapiDocument = YAML.load(__dirname + '/docs/openapi.yaml');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, {
  customSiteTitle: "MI Calculator API Docs"
  }));

  // Routes
  app.post('/api/calculate-mi', calculateMiHandler);
  app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

  return app;
}
