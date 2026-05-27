import { listProperties } from '../models/propertyModel.js';
import { sanitizeText } from '../middleware/security.js';

export function catalog(req, res) {
  const data = listProperties({
    operation: sanitizeText(req.query.operation || 'all'),
    city: sanitizeText(req.query.city || 'all'),
    type: sanitizeText(req.query.type || 'all'),
  }).map((property) => ({
    id: property.id,
    operation: property.operation,
    type: property.type,
    city: property.city,
    zone: property.zone,
    price: property.price,
    currency: property.currency,
    areaM2: property.areaM2,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parking: property.parking,
    lat: property.lat,
    lng: property.lng,
    updatedAt: property.listedAt,
  }));

  res.json({
    data,
    meta: {
      total: data.length,
      contract: 'partner-catalog-v1',
      generatedAt: new Date().toISOString(),
    },
  });
}
