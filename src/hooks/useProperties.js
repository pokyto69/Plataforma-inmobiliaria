import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../lib/api.js';

function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      params.set(key, value);
    }
  });
  return params.toString();
}

export function useProperties(filters, refreshKey = 0) {
  const [state, setState] = useState({
    properties: [],
    meta: { total: 0, options: { cities: [], zones: [], types: [] } },
    loading: true,
    error: '',
  });

  const query = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: '' }));

    apiGet(`/api/properties${query ? `?${query}` : ''}`, { signal: controller.signal })
      .then((payload) => {
        setState({
          properties: payload.data,
          meta: payload.meta,
          loading: false,
          error: '',
        });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message,
        }));
      });

    return () => controller.abort();
  }, [query, refreshKey]);

  return state;
}
