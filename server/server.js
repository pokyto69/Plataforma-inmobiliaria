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
    console.warn(`Aviso de Base de Datos: ${err.message}`);
    loadPropertiesToCache().finally(() => {
      app.listen(port, () => {
        console.log(`HabitatIQ API escuchando en http://127.0.0.1:${port} (sin BD)`);
      });
    });
  });
