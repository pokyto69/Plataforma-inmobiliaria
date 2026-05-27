# API para socios

Endpoint seguro para exponer el catalogo de inmuebles a socios externos.

## Autenticacion

Enviar la llave asignada en el header:

```http
x-partner-api-key: demo-partner-key
```

Las llaves se configuran en `PARTNER_API_KEYS`, separadas por coma.

## Catalogo

```http
GET /api/partners/properties
```

Filtros opcionales:

- `operation=sale|rent`
- `city=Ciudad de Mexico`
- `type=apartment|house|loft|penthouse`

Respuesta:

```json
{
  "data": [
    {
      "id": "mx-cdmx-polanco-001",
      "operation": "sale",
      "type": "apartment",
      "city": "Ciudad de Mexico",
      "zone": "Polanco",
      "price": 12800000,
      "currency": "MXN",
      "areaM2": 142,
      "bedrooms": 3,
      "bathrooms": 2.5,
      "parking": 2,
      "lat": 19.4339,
      "lng": -99.1957,
      "updatedAt": "2026-04-14"
    }
  ],
  "meta": {
    "total": 1,
    "contract": "partner-catalog-v1",
    "generatedAt": "2026-05-25T00:00:00.000Z"
  }
}
```

## Controles

- Rate limiting global en `/api`.
- Sin descripcion comercial larga para evitar exposicion innecesaria.
- CORS restringido por `CORS_ORIGINS`.
- Headers seguros con Helmet.
