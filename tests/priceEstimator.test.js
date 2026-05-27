import assert from 'node:assert/strict';
import test from 'node:test';
import { estimatePropertyPrice, normalizeValuationInput } from '../server/models/priceEstimator.js';

test('normaliza entradas del valuador dentro de rangos seguros', () => {
  const input = normalizeValuationInput({
    operation: 'sale',
    type: 'unknown',
    areaM2: 2,
    bedrooms: 99,
    bathrooms: -4,
    parking: 20,
    age: 120,
  });

  assert.equal(input.type, 'apartment');
  assert.equal(input.areaM2, 25);
  assert.equal(input.bedrooms, 8);
  assert.equal(input.bathrooms, 1);
  assert.equal(input.parking, 6);
  assert.equal(input.age, 80);
});

test('la estimacion de venta crece al aumentar la superficie', () => {
  const base = estimatePropertyPrice({
    operation: 'sale',
    type: 'apartment',
    zone: 'Roma Norte',
    areaM2: 70,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    age: 5,
  });

  const larger = estimatePropertyPrice({
    operation: 'sale',
    type: 'apartment',
    zone: 'Roma Norte',
    areaM2: 120,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    age: 5,
  });

  assert.ok(larger.estimate > base.estimate);
});

test('la renta mensual estimada es menor al valor de venta equivalente', () => {
  const payload = {
    type: 'apartment',
    zone: 'Condesa',
    areaM2: 100,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    age: 6,
  };

  const sale = estimatePropertyPrice({ ...payload, operation: 'sale' });
  const rent = estimatePropertyPrice({ ...payload, operation: 'rent' });

  assert.ok(rent.estimate < sale.estimate);
  assert.ok(rent.estimate > 15000);
});

test('las amenidades premium elevan el valor estimado', () => {
  const plain = estimatePropertyPrice({
    operation: 'sale',
    type: 'house',
    zone: 'Juriquilla',
    areaM2: 180,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    age: 2,
    amenities: [],
  });

  const premium = estimatePropertyPrice({
    operation: 'sale',
    type: 'house',
    zone: 'Juriquilla',
    areaM2: 180,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    age: 2,
    amenities: ['Jardin', 'Alberca', 'Vigilancia'],
  });

  assert.ok(premium.estimate > plain.estimate);
});
