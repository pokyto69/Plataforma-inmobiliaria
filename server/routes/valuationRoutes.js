import { Router } from 'express';
import { estimate } from '../controllers/valuationController.js';
import { csrfProtection, valuationLimiter } from '../middleware/security.js';

export const valuationRoutes = Router();

valuationRoutes.post('/estimate', valuationLimiter, csrfProtection, estimate);
