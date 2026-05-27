import { estimatePropertyPrice } from '../models/priceEstimator.js';
import { getPropertyById } from '../models/propertyModel.js';
import { sanitizeText } from '../middleware/security.js';

function sanitizePayload(payload) {
  return {
    ...payload,
    operation: sanitizeText(payload.operation),
    type: sanitizeText(payload.type),
    city: sanitizeText(payload.city),
    zone: sanitizeText(payload.zone),
    amenities: Array.isArray(payload.amenities)
      ? payload.amenities.map((amenity) => sanitizeText(amenity)).filter(Boolean)
      : [],
  };
}

export function estimate(req, res) {
  const valuation = estimatePropertyPrice(sanitizePayload(req.body || {}));
  const comparables = valuation.comparableIds
    .map(getPropertyById)
    .filter(Boolean)
    .map((property) => ({
      id: property.id,
      title: property.title,
      zone: property.zone,
      operation: property.operation,
      type: property.type,
      price: property.price,
      areaM2: property.areaM2,
      imageUrl: property.imageUrl,
    }));

  res.json({
    data: {
      ...valuation,
      comparables,
    },
  });
}
