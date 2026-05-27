import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { properties } from '../data/properties.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userPropertiesPath = process.env.USER_PROPERTIES_PATH
  ? path.resolve(process.env.USER_PROPERTIES_PATH)
  : path.resolve(__dirname, '../data/userProperties.json');
const defaultImageUrl =
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80';

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cleanText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function cleanNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return clamp(number, min, max);
}

function readUserProperties() {
  try {
    fs.mkdirSync(path.dirname(userPropertiesPath), { recursive: true });
    if (!fs.existsSync(userPropertiesPath)) {
      fs.writeFileSync(userPropertiesPath, '[]\n', 'utf8');
    }
    const data = JSON.parse(fs.readFileSync(userPropertiesPath, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeUserProperties(userProperties) {
  fs.mkdirSync(path.dirname(userPropertiesPath), { recursive: true });
  fs.writeFileSync(userPropertiesPath, `${JSON.stringify(userProperties, null, 2)}\n`, 'utf8');
}

export function getAllProperties() {
  return [...properties, ...readUserProperties()];
}

export function haversineKm(first, second) {
  const radius = 6371;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(second.lat - first.lat);
  const dLng = toRadians(second.lng - first.lng);
  const lat1 = toRadians(first.lat);
  const lat2 = toRadians(second.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function listProperties(filters = {}) {
  const minPrice = toNumber(filters.minPrice);
  const maxPrice = toNumber(filters.maxPrice);
  const bedrooms = toNumber(filters.bedrooms);
  const lat = toNumber(filters.lat);
  const lng = toNumber(filters.lng);
  const radiusKm = toNumber(filters.radiusKm) || 12;

  let results = getAllProperties();

  if (filters.operation && filters.operation !== 'all') {
    results = results.filter((property) => property.operation === filters.operation);
  }

  if (filters.type && filters.type !== 'all') {
    results = results.filter((property) => property.type === filters.type);
  }

  if (filters.city && filters.city !== 'all') {
    const city = filters.city.toLowerCase();
    results = results.filter((property) => property.city.toLowerCase() === city);
  }

  if (filters.zone) {
    const zone = filters.zone.toLowerCase();
    results = results.filter((property) => property.zone.toLowerCase().includes(zone));
  }

  if (minPrice !== undefined) {
    results = results.filter((property) => property.price >= minPrice);
  }

  if (maxPrice !== undefined) {
    results = results.filter((property) => property.price <= maxPrice);
  }

  if (bedrooms !== undefined) {
    results = results.filter((property) => property.bedrooms >= bedrooms);
  }

  if (lat !== undefined && lng !== undefined) {
    const origin = { lat, lng };
    results = results
      .map((property) => ({
        ...property,
        distanceKm: Number(haversineKm(origin, property).toFixed(2)),
      }))
      .filter((property) => property.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  } else {
    results.sort((a, b) => b.score - a.score);
  }

  return results;
}

export function getPropertyById(id) {
  return getAllProperties().find((property) => property.id === id);
}

export function getDistinctOptions() {
  const allProperties = getAllProperties();
  return {
    cities: [...new Set(allProperties.map((property) => property.city))].sort(),
    zones: [...new Set(allProperties.map((property) => property.zone))].sort(),
    types: [...new Set(allProperties.map((property) => property.type))].sort(),
  };
}

export function getMarketStats() {
  const allProperties = getAllProperties();
  const saleProperties = allProperties.filter((property) => property.operation === 'sale');
  const rentProperties = allProperties.filter((property) => property.operation === 'rent');
  const average = (items, getter) =>
    Math.round(items.reduce((sum, item) => sum + getter(item), 0) / Math.max(items.length, 1));

  return {
    total: allProperties.length,
    sale: saleProperties.length,
    rent: rentProperties.length,
    averageSalePrice: average(saleProperties, (property) => property.price),
    averageRentPrice: average(rentProperties, (property) => property.price),
    averageSaleM2: average(saleProperties, (property) => property.price / property.areaM2),
    averageRentM2: average(rentProperties, (property) => property.price / property.areaM2),
    topZones: Object.entries(
      allProperties.reduce((acc, property) => {
        acc[property.zone] = (acc[property.zone] || 0) + 1;
        return acc;
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([zone, count]) => ({ zone, count })),
  };
}

export function findComparableProperties(input, limit = 4) {
  const targetArea = Number(input.areaM2) || 0;
  return getAllProperties()
    .map((property) => {
      const zoneScore = property.zone === input.zone ? 0 : 18;
      const typeScore = property.type === input.type ? 0 : 12;
      const operationScore = property.operation === input.operation ? 0 : 8;
      const areaScore = targetArea ? Math.abs(property.areaM2 - targetArea) / targetArea : 1;
      return {
        property,
        score: zoneScore + typeScore + operationScore + areaScore * 20,
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ property }) => property);
}

export function createProperty(payload) {
  const title = cleanText(payload.title);
  const city = cleanText(payload.city);
  const zone = cleanText(payload.zone);
  const price = cleanNumber(payload.price, 0, 1, 500000000);
  const areaM2 = cleanNumber(payload.areaM2, 0, 15, 5000);

  if (!title || !city || !zone || !price || !areaM2) {
    const error = new Error('Titulo, ciudad, zona, precio y superficie son obligatorios.');
    error.status = 400;
    throw error;
  }

  const userProperties = readUserProperties();
  const property = {
    id: `user-${crypto.randomUUID()}`,
    title,
    operation: payload.operation === 'rent' ? 'rent' : 'sale',
    type: ['apartment', 'house', 'loft', 'penthouse'].includes(payload.type) ? payload.type : 'house',
    city,
    zone,
    address: cleanText(payload.address, `${zone}, ${city}`),
    price,
    currency: 'MXN',
    areaM2,
    bedrooms: cleanNumber(payload.bedrooms, 2, 0, 12),
    bathrooms: cleanNumber(payload.bathrooms, 1, 1, 12),
    parking: cleanNumber(payload.parking, 0, 0, 8),
    age: cleanNumber(payload.age, 0, 0, 120),
    lat: cleanNumber(payload.lat, 19.4326, -90, 90),
    lng: cleanNumber(payload.lng, -99.1332, -180, 180),
    score: 76,
    amenities: Array.isArray(payload.amenities) ? payload.amenities.slice(0, 8).map((item) => cleanText(item)).filter(Boolean) : [],
    features: ['Publicado por propietario', 'Contacto directo'],
    description: cleanText(payload.description, 'Inmueble publicado por un usuario de HabitatIQ.'),
    imageUrl: cleanText(payload.imageUrl, defaultImageUrl),
    listedAt: new Date().toISOString().slice(0, 10),
    owner: {
      name: cleanText(payload.ownerName, 'Propietario'),
      phone: cleanText(payload.ownerPhone),
      email: cleanText(payload.ownerEmail),
    },
    source: 'user',
  };

  userProperties.unshift(property);
  writeUserProperties(userProperties);
  return property;
}
