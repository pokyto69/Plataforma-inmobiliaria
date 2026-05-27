import { getConfig } from './config/env.js';
import { createApp } from './app.js';

const { port } = getConfig();
const app = createApp();

app.listen(port, () => {
  console.log(`HabitatIQ API escuchando en http://127.0.0.1:${port}`);
});
