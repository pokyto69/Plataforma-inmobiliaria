export function getConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultOrigins = 'http://127.0.0.1:5174,http://localhost:5174';
  const corsOrigins = (process.env.CORS_ORIGINS || defaultOrigins)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const partnerKeys = (process.env.PARTNER_API_KEYS || (isProduction ? '' : 'demo-partner-key'))
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  return {
    isProduction,
    port: Number(process.env.PORT || 3000),
    corsOrigins,
    partnerKeys,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  };
}
