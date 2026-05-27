# Despliegue cloud distribuido

## Empaquetado

El `Dockerfile` usa tres etapas:

1. `deps`: instala dependencias reproducibles con `npm ci`.
2. `build`: compila React/Vite en `dist/`.
3. `runner`: instala dependencias productivas y ejecuta Express.

## SSL administrado

`docker-compose.yml` incluye Caddy como reverse proxy. Con un dominio publico apuntando al servidor:

```powershell
$env:DOMAIN="habitatiq.example.com"
$env:ACME_EMAIL="admin@example.com"
docker compose up --build -d
```

Caddy solicita, instala y renueva certificados TLS automaticamente.

## Servidores distribuidos

Patron recomendado:

- Publicar imagen en GitLab Container Registry.
- Ejecutar 2 o mas replicas en regiones/cloud zones distintas.
- Colocar balanceador administrado delante de las replicas.
- Terminar TLS en Caddy o en el ingress del proveedor cloud.
- Definir `PARTNER_API_KEYS` como secreto del orquestador.
- Persistir `USER_PROPERTIES_PATH` en un volumen o reemplazarlo por una base de datos administrada.
- Usar logs centralizados y metricas de latencia p95/p99.

## GitLab CI/CD

El pipeline `.gitlab-ci.yml` ejecuta:

- `unit_tests`: pruebas de algoritmo y API.
- `frontend_build`: build de cliente.
- `docker_image`: construccion y push de imagen.
- `performance_smoke`: prueba de carga basica.
- `deploy_production`: paso manual para actualizar el entorno cloud.
