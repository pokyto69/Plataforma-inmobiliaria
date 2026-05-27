export function notFound(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado.' });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = status >= 500 ? 'Error interno del servidor.' : err.message;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}
