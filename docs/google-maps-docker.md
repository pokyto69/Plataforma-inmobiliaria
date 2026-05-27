# Google Maps y Docker

## Que necesitas

- Una API key de Google Maps Platform.
- La API **Maps JavaScript API** habilitada en Google Cloud.
- Facturacion activa en Google Cloud.
- Docker Desktop instalado y en ejecucion.

En esta maquina Docker ya esta disponible:

- `docker --version`
- `docker compose version`

## Crear la API key

1. Entra a Google Cloud Console.
2. Crea o selecciona un proyecto.
3. Habilita **Maps JavaScript API**.
4. Crea una API key.
5. Restringe la llave:
   - Application restrictions: HTTP referrers.
   - Desarrollo local: `http://127.0.0.1:5174/*`, `http://localhost/*`.
   - Produccion: `https://tudominio.com/*`.
   - API restrictions: Maps JavaScript API.

## Configurar la app local

Desde PowerShell:

```powershell
cd "C:\Users\poky4\Downloads\Limpieza de datos\plataforma-inmobiliaria-inteligente"
Copy-Item .env.example .env
notepad .env
```

Edita estas lineas:

```env
VITE_GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE
GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE
DOMAIN=localhost
```

Guarda el archivo y reinicia el servidor:

```powershell
npm run dev
```

Abre:

```text
http://127.0.0.1:5174
```

Si el servidor ya estaba abierto antes de editar `.env`, detenlo con `Ctrl+C` y vuelve a ejecutar `npm run dev`. Vite solo lee `VITE_GOOGLE_MAPS_API_KEY` al arrancar.

## Ejecutar con Docker

Con `.env` ya configurado:

```powershell
npm run docker:up
```

O directamente:

```powershell
docker compose up --build
```

Luego abre:

```text
http://localhost
```

Para detener los contenedores:

```powershell
npm run docker:down
```

## Produccion con dominio y SSL

En `.env` cambia:

```env
DOMAIN=tudominio.com
ACME_EMAIL=admin@tudominio.com
VITE_GOOGLE_MAPS_API_KEY=TU_API_KEY_RESTRINGIDA
```

Apunta el DNS del dominio al servidor cloud y ejecuta:

```powershell
docker compose up --build -d
```

Caddy toma el trafico en puertos `80` y `443`, publica la app y gestiona el certificado SSL automaticamente.
