import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.middleware';
import { apiRateLimiter, authRateLimiter } from './middleware/rate-limiter';
import { authenticateJWT, requireRole } from './middleware/auth.middleware';
import { 
  registerValidationRules, 
  loginValidationRules, 
  updateFlowValidationRules, 
  updateBinValidationRules, 
  postIncidentValidationRules,
  validateRequest 
} from './middleware/validation';

import { AuthController } from './controllers/auth.controller';
import { MatchController } from './controllers/match.controller';
import { OpsController } from './controllers/ops.controller';
import { TransitController } from './controllers/transit.controller';
import { AIController } from './controllers/ai.controller';

const app = express();

// Standard Production Middlewares
app.use(helmet());
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('combined')); // Production-ready logger formats

// Public Check Route
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Auth Routes (Rate limited)
app.post('/api/auth/register', authRateLimiter, registerValidationRules, validateRequest, AuthController.register);
app.post('/api/auth/login', authRateLimiter, loginValidationRules, validateRequest, AuthController.login);
app.get('/api/auth/me', authenticateJWT, AuthController.getMe);

// Match & Schedules Routes
app.get('/api/matches', MatchController.listMatches);
app.get('/api/matches/:id', MatchController.getMatchDetail);

// Gates & Queue Flow Routes
app.get('/api/stadiums/:stadiumId/gates', OpsController.getGates);
app.patch(
  '/api/stadiums/:stadiumId/gates/:gateId/flow', 
  authenticateJWT, 
  requireRole(['organizer']), 
  updateFlowValidationRules, 
  validateRequest, 
  OpsController.updateGateFlow
);

// Smart Bins & Route Optimizations
app.get('/api/stadiums/:stadiumId/bins', OpsController.getBins);
app.patch(
  '/api/stadiums/:stadiumId/bins/:binId/level', 
  updateBinValidationRules, 
  validateRequest, 
  OpsController.updateBinLevel
);
app.get(
  '/api/stadiums/:stadiumId/bins/routes', 
  authenticateJWT, 
  requireRole(['organizer']), 
  OpsController.getOptimizedBinRoutes
);

// Transit Schedule Routes
app.get('/api/transit/schedules', TransitController.getSchedules);
app.patch(
  '/api/transit/schedules/:id', 
  authenticateJWT, 
  requireRole(['organizer']), 
  TransitController.updateTransitStatus
);

// Incidents Logging Routes
app.get('/api/incidents', OpsController.getIncidents);
app.post(
  '/api/incidents', 
  authenticateJWT, 
  postIncidentValidationRules, 
  validateRequest, 
  OpsController.reportIncident
);
app.patch(
  '/api/incidents/:id', 
  authenticateJWT, 
  requireRole(['organizer']), 
  OpsController.updateIncident
);

// AI Gemini Assistant Routes (Rate Limited)
app.post('/api/ai/chat', apiRateLimiter, AIController.fanChat);
app.post(
  '/api/ai/ops-query', 
  apiRateLimiter, 
  authenticateJWT, 
  requireRole(['organizer']), 
  AIController.opsQuery
);

// Global Error Handler
app.use(errorHandler);

export default app;
