import { Router } from 'express';
import { nearby } from '../controllers/geolocationController.js';

export const geolocationRoutes = Router();

geolocationRoutes.get('/nearby', nearby);
