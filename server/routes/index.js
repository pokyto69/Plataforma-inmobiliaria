import { Router } from 'express';
import { geolocationRoutes } from './geolocationRoutes.js';
import { partnerRoutes } from './partnerRoutes.js';
import { propertyRoutes } from './propertyRoutes.js';
import { securityRoutes } from './securityRoutes.js';
import { valuationRoutes } from './valuationRoutes.js';

export const apiRoutes = Router();

apiRoutes.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'habitatiq-api',
    timestamp: new Date().toISOString(),
  });
});

apiRoutes.use('/security', securityRoutes);
apiRoutes.use('/properties', propertyRoutes);
apiRoutes.use('/valuation', valuationRoutes);
apiRoutes.use('/partners', partnerRoutes);
apiRoutes.use('/geolocation', geolocationRoutes);
