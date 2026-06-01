import { Router } from 'express';
import * as propertyController from '../controllers/propertyController.js';
import { csrfProtection } from '../middleware/security.js';

export const propertyRoutes = Router();

propertyRoutes.get('/', propertyController.list);
propertyRoutes.get('/stats', propertyController.stats);
propertyRoutes.post('/', csrfProtection, propertyController.create);
propertyRoutes.get('/:id', propertyController.show);
propertyRoutes.post('/:id/request', csrfProtection, propertyController.addRequest);
propertyRoutes.post('/:id/confirm', csrfProtection, propertyController.confirmSale);
propertyRoutes.post('/:id/cancel-request', csrfProtection, propertyController.cancelRequest);
