import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { getConfig } from '../config/env.js';

const csrfCookieName = 'habitatiq_csrf';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 180),
  standardHeaders: true,
  legacyHeaders: false,
});

export const valuationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.VALUATION_RATE_LIMIT || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas estimaciones. Intenta de nuevo en un minuto.' },
});

export function sanitizeText(value) {
  return sanitizeHtml(String(value || ''), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

export function issueCsrfToken(req, res) {
  const { isProduction } = getConfig();
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(csrfCookieName, token, {
    sameSite: 'strict',
    secure: isProduction,
    httpOnly: false,
    path: '/',
    maxAge: 1000 * 60 * 60 * 2,
  });
  return token;
}

export function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[csrfCookieName];
  const headerToken = req.get('x-csrf-token');

  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length) {
    res.status(403).json({ error: 'Token CSRF invalido o ausente.' });
    return;
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (!crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
    res.status(403).json({ error: 'Token CSRF invalido o ausente.' });
    return;
  }

  next();
}

export function partnerAuth(req, res, next) {
  const { partnerKeys } = getConfig();
  const apiKey = req.get('x-partner-api-key');

  if (!partnerKeys.length || !apiKey || !partnerKeys.includes(apiKey)) {
    res.status(401).json({ error: 'Credenciales de socio invalidas.' });
    return;
  }

  next();
}
