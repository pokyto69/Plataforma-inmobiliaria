# Seguridad

## XSS

- React escapa texto por defecto.
- El backend sanitiza texto entrante con `sanitize-html`.
- No se usa `dangerouslySetInnerHTML`.
- Helmet agrega cabeceras de seguridad y CSP en produccion.

## CSRF

El frontend solicita `GET /api/security/csrf-token`. El servidor entrega:

- Cookie `habitatiq_csrf`.
- Token JSON para enviar en `x-csrf-token`.

Las mutaciones, como `POST /api/valuation/estimate` y `POST /api/properties`, requieren ambos valores.

## CORS y socios

- `CORS_ORIGINS` limita origenes autorizados.
- `/api/partners/properties` exige `x-partner-api-key`.
- `express-rate-limit` limita abuso sobre `/api`.
- `API_RATE_LIMIT` y `VALUATION_RATE_LIMIT` ajustan cuotas por minuto.
