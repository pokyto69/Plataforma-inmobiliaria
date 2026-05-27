import { Router } from 'express';
import { csrfToken } from '../controllers/securityController.js';

export const securityRoutes = Router();

securityRoutes.get('/csrf-token', csrfToken);
