import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { properties as seedProperties } from '../data/properties.js';
import { isDbConnected, query } from '../config/db.js';

let cachedProperties = null;

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

function saveBase64Image(base64Str) {
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    return base64Str;
  }
  try {
    const matches = base64Str.match(/^data:image\/([A-Za-z0-9-+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }
    const ext = matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');
    const filename = `property-${crypto.randomUUID()}.${ext}`;
    const uploadsDir = path.join(path.dirname(userPropertiesPath), 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, dataBuffer);
    return `/api/uploads/${filename}`;
  } catch (err) {
    console.error('Error al guardar la imagen base64:', err);
    return base64Str;
  }
}

export async function loadPropertiesToCache() {
  if (isDbConnected()) {
    try {
      console.log('Cargando registros de PostgreSQL en el cache de memoria...');
      const { rows } = await query('SELECT * FROM properties');
      cachedProperties = rows.map((row) => ({
        id: row.id,
        title: row.title,
        operation: row.operation,
        type: row.type,
        city: row.city,
        zone: row.zone,
        address: row.address,
        price: Number(row.price),
        currency: row.currency,
        areaM2: Number(row.area_m2),
        bedrooms: Number(row.bedrooms),
        bathrooms: Number(row.bathrooms),
        parking: Number(row.parking),
        age: Number(row.age),
        lat: Number(row.lat),
        lng: Number(row.lng),
        score: Number(row.score),
        amenities: row.amenities || [],
        features: row.features || [],
        description: row.description,
        imageUrl: row.image_url,
        listedAt: row.listed_at,
        owner: {
          name: row.owner_name,
          phone: row.owner_phone,
          email: row.owner_email,
        },
        source: row.source,
        status: row.status || 'available',
        requests: JSON.parse(row.requests || '[]'),
      }));
      console.log(`Cache sincronizado con ${cachedProperties.length} propiedades.`);
    } catch (err) {
      console.error('Error cargando propiedades desde la BD, usando fallback local:', err);
      cachedProperties = [...seedProperties, ...readUserProperties()];
    }
  } else {
    cachedProperties = [...seedProperties, ...readUserProperties()];
  }
}

export function getAllProperties() {
  if (!cachedProperties) {
    cachedProperties = [...seedProperties, ...readUserProperties()];
  }
  return cachedProperties;
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
    imageUrl: saveBase64Image(cleanText(payload.imageUrl, defaultImageUrl)),
    listedAt: new Date().toISOString().slice(0, 10),
    owner: {
      name: cleanText(payload.ownerName, 'Propietario'),
      phone: cleanText(payload.ownerPhone),
      email: cleanText(payload.ownerEmail),
    },
    source: 'user',
    status: 'available',
    requests: [],
  };

  if (!cachedProperties) {
    cachedProperties = [...seedProperties, ...readUserProperties()];
  }
  cachedProperties.unshift(property);

  if (isDbConnected()) {
    query(`
      INSERT INTO properties (
        id, title, operation, type, city, zone, address, price, currency,
        area_m2, bedrooms, bathrooms, parking, age, lat, lng, score,
        amenities, features, description, image_url, listed_at,
        owner_name, owner_phone, owner_email, source, status, requests
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
    `, [
      property.id,
      property.title,
      property.operation,
      property.type,
      property.city,
      property.zone,
      property.address,
      property.price,
      property.currency,
      property.areaM2,
      property.bedrooms,
      property.bathrooms,
      property.parking,
      property.age,
      property.lat,
      property.lng,
      property.score,
      property.amenities,
      property.features,
      property.description,
      property.imageUrl,
      property.listedAt,
      property.owner.name,
      property.owner.phone,
      property.owner.email,
      property.source,
      property.status,
      JSON.stringify(property.requests),
    ]).catch((err) => {
      console.error('Error insertando propiedad en BD:', err);
    });
  } else {
    const userProperties = readUserProperties();
    userProperties.unshift(property);
    writeUserProperties(userProperties);
  }

  return property;
}

export async function updatePropertyStatusAndRequests(id, status, requests) {
  const property = getPropertyById(id);
  if (!property) return null;

  property.status = status;
  property.requests = requests;

  if (isDbConnected()) {
    try {
      await query(
        'UPDATE properties SET status = $1, requests = $2 WHERE id = $3',
        [status, JSON.stringify(requests), id]
      );
    } catch (err) {
      console.error('Error actualizando propiedad en BD:', err);
    }
  } else {
    const userProperties = readUserProperties();
    const index = userProperties.findIndex((p) => p.id === id);
    if (index !== -1) {
      userProperties[index].status = status;
      userProperties[index].requests = requests;
      writeUserProperties(userProperties);
    }
  }

  return property;
}
