# Pruebas

## Unitarias

`tests/priceEstimator.test.js` valida:

- Normalizacion de entradas.
- Crecimiento del precio con la superficie.
- Diferencia entre venta y renta mensual.
- Impacto de amenidades premium.

```powershell
npm run test
```

## API

`tests/api.test.js` levanta Express en un puerto efimero y verifica:

- Catalogo publico.
- Bloqueo CSRF.
- Estimacion con token CSRF valido.
- API de socios protegida con llave.

## Rendimiento

`tests/performance/autocannon.mjs` ejecuta carga concurrente con `fetch` nativo contra `/api/properties`:

```powershell
npm run perf
```

Umbrales actuales:

- Errores: `0`.
- Latencia p99: menor o igual a `450ms`.

Los umbrales se pueden endurecer al mover datos a una base real y agregar cache.
