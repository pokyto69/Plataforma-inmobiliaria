let csrfToken = '';

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Solicitud no completada.');
  }
  return payload;
}

export async function apiGet(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
  });
  return parseResponse(response);
}

export async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  const payload = await apiGet('/api/security/csrf-token');
  csrfToken = payload.csrfToken;
  return csrfToken;
}

export async function apiPost(path, body) {
  const token = await getCsrfToken();
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': token,
    },
    body: JSON.stringify(body),
  });
  return parseResponse(response);
}
