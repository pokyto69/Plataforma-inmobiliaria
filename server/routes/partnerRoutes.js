import { Router } from 'express';
import { catalog } from '../controllers/partnerController.js';
import { partnerAuth } from '../middleware/security.js';

export const partnerRoutes = Router();

partnerRoutes.get('/properties', partnerAuth, catalog);
