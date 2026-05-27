import { listProperties } from '../models/propertyModel.js';

export function nearby(req, res) {
  const data = listProperties({
    lat: req.query.lat,
    lng: req.query.lng,
    radiusKm: req.query.radiusKm || 20,
    operation: req.query.operation || 'all',
    type: req.query.type || 'all',
  });

  res.json({
    data,
    meta: {
      total: data.length,
      origin: {
        lat: Number(req.query.lat),
        lng: Number(req.query.lng),
      },
    },
  });
}
