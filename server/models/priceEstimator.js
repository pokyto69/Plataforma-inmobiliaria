import { findComparableProperties } from './propertyModel.js';

export const zonePricePerM2 = {
  Polanco: 90500,
  'Roma Norte': 70500,
  Providencia: 41000,
  'San Pedro': 93000,
  Narvarte: 53500,
  Juriquilla: 33000,
  Angelopolis: 36500,
  Condesa: 73500,
};

const typeMultipliers = {
  apartment: 1,
  house: 1.06,
  loft: 0.94,
  penthouse: 1.2,
};

const rentYieldByZone = {
  Polanco: 0.0047,
  'Roma Norte': 0.0054,
  Providencia: 0.0042,
  'San Pedro': 0.0045,
  Narvarte: 0.005,
  Juriquilla: 0.0043,
  Angelopolis: 0.0048,
  Condesa: 0.0056,
};

const amenityImpact = {
  terrace: 0.025,
  terraza: 0.025,
  garden: 0.03,
  jardin: 0.03,
  pool: 0.028,
  alberca: 0.028,
  gym: 0.018,
  gimnasio: 0.018,
  security: 0.015,
  vigilancia: 0.015,
  elevator: 0.01,
  elevador: 0.01,
  solar: 0.018,
  coworking: 0.012,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, min, max);
}

export function normalizeValuationInput(payload = {}) {
  const zone = normalizeText(payload.zone) || 'Narvarte';
  return {
    operation: payload.operation === 'rent' ? 'rent' : 'sale',
    type: typeMultipliers[payload.type] ? payload.type : 'apartment',
    city: normalizeText(payload.city) || 'Ciudad de Mexico',
    zone,
    areaM2: normalizeNumber(payload.areaM2, 90, 25, 1200),
    bedrooms: normalizeNumber(payload.bedrooms, 2, 0, 8),
    bathrooms: normalizeNumber(payload.bathrooms, 2, 1, 8),
    parking: normalizeNumber(payload.parking, 1, 0, 6),
    age: normalizeNumber(payload.age, 8, 0, 80),
    amenities: Array.isArray(payload.amenities)
      ? payload.amenities.map(normalizeText).filter(Boolean)
      : [],
  };
}

export function estimatePropertyPrice(payload = {}) {
  const input = normalizeValuationInput(payload);
  const baseM2 = zonePricePerM2[input.zone] || 46500;
  const knownZone = Boolean(zonePricePerM2[input.zone]);
  const newnessFactor = input.age <= 2 ? 1.04 : 1 - Math.min(input.age * 0.006, 0.18);
  const roomFactor =
    1 +
    Math.min(input.bedrooms, 5) * 0.012 +
    Math.min(input.bathrooms, 5) * 0.018 +
    Math.min(input.parking, 4) * 0.024;
  const amenityFactor =
    1 +
    input.amenities.reduce((sum, amenity) => {
      const key = amenity.toLowerCase();
      return sum + (amenityImpact[key] || 0.006);
    }, 0);

  const saleEstimate =
    baseM2 * input.areaM2 * typeMultipliers[input.type] * roomFactor * newnessFactor * amenityFactor;
  const monthlyYield = rentYieldByZone[input.zone] || 0.0047;
  const estimate = input.operation === 'rent' ? saleEstimate * monthlyYield : saleEstimate;
  const comparableProperties = findComparableProperties(input, 4);
  const spread = knownZone ? 0.09 : 0.16;
  const confidence = Math.round(
    clamp(72 + (knownZone ? 12 : -6) + Math.min(input.amenities.length * 2, 8) + comparableProperties.length, 52, 96),
  );

  return {
    input,
    estimate: Math.round(estimate),
    low: Math.round(estimate * (1 - spread)),
    high: Math.round(estimate * (1 + spread)),
    currency: 'MXN',
    operation: input.operation,
    confidence,
    pricePerM2: Math.round((input.operation === 'rent' ? estimate : saleEstimate) / input.areaM2),
    comparableIds: comparableProperties.map((property) => property.id),
    factors: [
      { label: 'Zona', impact: knownZone ? 'Referencia local disponible' : 'Zona estimada por promedio urbano' },
      { label: 'Superficie', impact: `${Math.round(input.areaM2)} m2` },
      { label: 'Tipo', impact: input.type },
      { label: 'Antiguedad', impact: `${Math.round(input.age)} anos` },
      { label: 'Amenidades', impact: input.amenities.length ? input.amenities.join(', ') : 'Sin amenidades premium' },
    ],
  };
}
