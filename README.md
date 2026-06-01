# HabitatIQ: Plataforma Inmobiliaria Inteligente

Portal web para compra, venta y renta de propiedades con estimaciones automaticas de precio, arquitectura MVC, cliente reactivo, seguridad web, APIs para socios, Docker y pipeline GitLab CI/CD.

## Stack

- Backend MVC: Node.js + Express, modelos, controladores, rutas y middlewares separados.
- Frontend reactivo: React + Vite con componentes desacoplados.
- Datos: catalogo semilla en memoria y algoritmo de valuacion basado en zona, m2, tipo, antiguedad y amenidades.
- Perfiles: comprador para buscar inmuebles y vendedor para publicar casas/departamentos propios.
- Seguridad: Helmet, CORS controlado, rate limiting, sanitizado XSS, cookie/token CSRF y API key para socios.
- Mapas: Leaflet interactivo con tiles de OpenStreetMap (sin requerir llaves API).
- Despliegue: Docker multi-stage + Caddy como reverse proxy con SSL administrado.
- Pruebas: unitarias del valuador, API smoke tests y rendimiento con carga concurrente nativa.

## Ejecutar en desarrollo

```powershell
cd "C:\Users\poky4\Downloads\Limpieza de datos\plataforma-inmobiliaria-inteligente"
npm install
npm run dev
```

URLs locales:

- Web: `http://127.0.0.1:5174`
- API: `http://127.0.0.1:3000/api/health`

## Variables de entorno

Copia `.env.example` a `.env` cuando necesites valores reales:

```powershell
Copy-Item .env.example .env
```

Variables principales:

- `PARTNER_API_KEYS`: llaves validas para socios externos.
- `CORS_ORIGINS`: origenes web autorizados.
- `USER_PROPERTIES_PATH`: archivo JSON donde se guardan publicaciones de usuarios.
- `DOMAIN` y `ACME_EMAIL`: dominio y correo para SSL automatico con Caddy.

## Scripts

```powershell
npm run dev      # API + frontend
npm run build    # build de React
npm run start    # API y frontend compilado desde dist/
npm run test     # pruebas unitarias/API
npm run perf     # prueba de rendimiento web
```

## Docker

```powershell
docker compose up --build
```

Con `DOMAIN=tudominio.com`, Caddy solicita y renueva certificados TLS automaticamente.

El mapa interactivo utiliza Leaflet y OpenStreetMap, por lo que no se requiere configurar ninguna clave API adicional.

## Web service para socios

```powershell
Invoke-RestMethod `
  -Headers @{ "x-partner-api-key" = "demo-partner-key" } `
  http://127.0.0.1:3000/api/partners/properties
```

Mas detalles en [docs/partner-api.md](docs/partner-api.md).
