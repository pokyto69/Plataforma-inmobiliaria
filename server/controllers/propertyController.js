import {
  createProperty,
  getDistinctOptions,
  getMarketStats,
  getPropertyById,
  listProperties,
} from '../models/propertyModel.js';
import { sanitizeText } from '../middleware/security.js';

function cleanFilters(query) {
  return {
    operation: sanitizeText(query.operation || 'all'),
    type: sanitizeText(query.type || 'all'),
    city: sanitizeText(query.city || 'all'),
    zone: sanitizeText(query.zone || ''),
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    bedrooms: query.bedrooms,
    lat: query.lat,
    lng: query.lng,
    radiusKm: query.radiusKm,
  };
}

export function list(req, res) {
  const filters = cleanFilters(req.query);
  const data = listProperties(filters);

  res.json({
    data,
    meta: {
      total: data.length,
      filters,
      options: getDistinctOptions(),
    },
  });
}

export function show(req, res) {
  const property = getPropertyById(sanitizeText(req.params.id));

  if (!property) {
    res.status(404).json({ error: 'Inmueble no encontrado.' });
    return;
  }

  res.json({ data: property });
}

export function stats(req, res) {
  res.json({ data: getMarketStats() });
}

export function create(req, res) {
  const body = req.body || {};
  const property = createProperty({
    ...body,
    title: sanitizeText(body.title),
    operation: sanitizeText(body.operation),
    type: sanitizeText(body.type),
    city: sanitizeText(body.city),
    zone: sanitizeText(body.zone),
    address: sanitizeText(body.address),
    description: sanitizeText(body.description),
    imageUrl: sanitizeText(body.imageUrl),
    ownerName: sanitizeText(body.ownerName),
    ownerPhone: sanitizeText(body.ownerPhone),
    ownerEmail: sanitizeText(body.ownerEmail),
    amenities: Array.isArray(body.amenities)
      ? body.amenities.map((amenity) => sanitizeText(amenity)).filter(Boolean)
      : [],
  });

  res.status(201).json({ data: property });
}
