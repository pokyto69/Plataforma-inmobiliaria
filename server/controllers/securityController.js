import { issueCsrfToken } from '../middleware/security.js';

export function csrfToken(req, res) {
  const token = issueCsrfToken(req, res);
  res.json({ csrfToken: token });
}
