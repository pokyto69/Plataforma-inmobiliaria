process.env.API_RATE_LIMIT = '100000';
process.env.VALUATION_RATE_LIMIT = '100000';

const { createApp } = await import('../../server/app.js');

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const server = await listen(createApp());
const url = `http://127.0.0.1:${server.address().port}/api/properties`;

try {
  const durationMs = 8000;
  const concurrency = 20;
  const endAt = performance.now() + durationMs;
  const latencies = [];
  let completed = 0;
  let errors = 0;

  async function worker() {
    while (performance.now() < endAt) {
      const start = performance.now();
      try {
        const response = await fetch(url);
        await response.arrayBuffer();
        if (!response.ok) errors += 1;
      } catch {
        errors += 1;
      } finally {
        latencies.push(performance.now() - start);
        completed += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  latencies.sort((a, b) => a - b);
  const p99Index = Math.max(0, Math.ceil(latencies.length * 0.99) - 1);
  const p99 = latencies[p99Index] || 0;
  const requestsPerSecond = completed / (durationMs / 1000);

  console.log(`Requests/sec: ${requestsPerSecond.toFixed(2)}`);
  console.log(`Latency p99: ${p99.toFixed(2)}ms`);
  console.log(`Errors: ${errors}`);

  if (errors > 0) {
    throw new Error('La prueba de rendimiento reporto errores HTTP.');
  }

  if (p99 > 450) {
    throw new Error(`Latencia p99 por encima del umbral: ${p99.toFixed(2)}ms.`);
  }

  if (requestsPerSecond < 120) {
    throw new Error(`Throughput por debajo del umbral: ${requestsPerSecond.toFixed(2)} req/s.`);
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}
