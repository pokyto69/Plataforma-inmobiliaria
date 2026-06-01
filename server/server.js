import { getConfig } from './config/env.js';
import { createApp } from './app.js';
import { initDb } from './config/db.js';
import { loadPropertiesToCache } from './models/propertyModel.js';

const { port } = getConfig();
const app = createApp();

// Inicializar la base de datos si esta conectada
initDb()
  .then(() => loadPropertiesToCache())
  .then(() => {
    app.listen(port, () => {
      console.log(`HabitatIQ API escuchando en http://127.0.0.1:${port}`);
    });
  })
  .catch((err) => {
    console.error('Fallo al iniciar base de datos:', err);
    loadPropertiesToCache().finally(() => {
      app.listen(port, () => {
        console.log(`HabitatIQ API escuchando en http://127.0.0.1:${port} (sin BD)`);
      });
    });
  });
