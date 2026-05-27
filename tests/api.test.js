import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { createApp } from '../server/app.js';

let server;
let baseUrl;
let originalUserProperties = '[]\n';
const userPropertiesPath = new URL('../server/data/userProperties.json', import.meta.url);

before(async () => {
  process.env.PARTNER_API_KEYS = 'test-partner-key';
  originalUserProperties = await fs.readFile(userPropertiesPath, 'utf8').catch(() => '[]\n');
  await fs.writeFile(userPropertiesPath, '[]\n', 'utf8');
  server = await new Promise((resolve) => {
    const app = createApp();
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.writeFile(userPropertiesPath, originalUserProperties, 'utf8');
});

test('expone catalogo publico de inmuebles', async () => {
  const response = await fetch(`${baseUrl}/api/properties`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(payload.data));
  assert.ok(payload.data.length >= 5);
  assert.ok(payload.meta.options.zones.includes('Polanco'));
});

test('bloquea mutaciones sin token CSRF', async () => {
  const response = await fetch(`${baseUrl}/api/valuation/estimate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ zone: 'Roma Norte', areaM2: 90 }),
  });

  assert.equal(response.status, 403);
});

test('permite estimaciones con token CSRF valido', async () => {
  const csrfResponse = await fetch(`${baseUrl}/api/security/csrf-token`);
  const csrfPayload = await csrfResponse.json();
  const cookie = csrfResponse.headers.get('set-cookie').split(';')[0];

  const response = await fetch(`${baseUrl}/api/valuation/estimate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': csrfPayload.csrfToken,
      cookie,
    },
    body: JSON.stringify({
      operation: 'sale',
      type: 'apartment',
      zone: 'Roma Norte',
      areaM2: 92,
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      age: 6,
      amenities: ['Vigilancia'],
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(payload.data.estimate > 0);
  assert.ok(payload.data.comparables.length > 0);
});

test('protege el web service de socios con API key', async () => {
  const denied = await fetch(`${baseUrl}/api/partners/properties`);
  assert.equal(denied.status, 401);

  const allowed = await fetch(`${baseUrl}/api/partners/properties`, {
    headers: { 'x-partner-api-key': 'test-partner-key' },
  });
  const payload = await allowed.json();

  assert.equal(allowed.status, 200);
  assert.equal(payload.meta.contract, 'partner-catalog-v1');
  assert.ok(payload.data.every((item) => item.id && item.price));
});

test('permite publicar un inmueble de usuario con CSRF valido', async () => {
  const csrfResponse = await fetch(`${baseUrl}/api/security/csrf-token`);
  const csrfPayload = await csrfResponse.json();
  const cookie = csrfResponse.headers.get('set-cookie').split(';')[0];

  const response = await fetch(`${baseUrl}/api/properties`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': csrfPayload.csrfToken,
      cookie,
    },
    body: JSON.stringify({
      title: 'Casa de prueba publicada',
      operation: 'sale',
      type: 'house',
      city: 'Ciudad de Mexico',
      zone: 'Zona Test',
      price: 3200000,
      areaM2: 120,
      bedrooms: 3,
      bathrooms: 2,
      parking: 1,
      lat: 19.4,
      lng: -99.13,
      ownerName: 'Propietario Test',
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.data.source, 'user');
  assert.equal(payload.data.zone, 'Zona Test');

  const listResponse = await fetch(`${baseUrl}/api/properties?zone=Zona%20Test`);
  const listPayload = await listResponse.json();
  assert.ok(listPayload.data.some((property) => property.id === payload.data.id));
});
