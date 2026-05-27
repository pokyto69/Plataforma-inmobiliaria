import { useEffect, useMemo, useRef, useState } from 'react';
import { Building, Map, Navigation } from 'lucide-react';
import { formatCurrency } from '../lib/formatters.js';

let mapsPromise;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    const callbackName = `__habitatIqMapsReady_${Date.now()}`;
    const params = new URLSearchParams({
      key: apiKey,
      loading: 'async',
      v: 'weekly',
      callback: callbackName,
    });
    window[callbackName] = () => {
      resolve(window.google.maps);
      delete window[callbackName];
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[callbackName];
      reject(new Error('Google Maps no cargo.'));
    };
    document.head.appendChild(script);
  });

  return mapsPromise;
}

function getBounds(properties) {
  const lats = properties.map((property) => property.lat);
  const lngs = properties.map((property) => property.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

function fallbackPosition(property, bounds) {
  const latRange = Math.max(bounds.maxLat - bounds.minLat, 0.001);
  const lngRange = Math.max(bounds.maxLng - bounds.minLng, 0.001);
  const left = ((property.lng - bounds.minLng) / lngRange) * 82 + 8;
  const top = (1 - (property.lat - bounds.minLat) / latRange) * 76 + 10;
  return { left: `${left}%`, top: `${top}%` };
}

export function MapPanel({ properties, selectedId, onSelect }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const selected = properties.find((property) => property.id === selectedId) || properties[0];
  const bounds = useMemo(() => (properties.length ? getBounds(properties) : null), [properties]);

  useEffect(() => {
    if (!apiKey || !mapRef.current || !properties.length) return;
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        setMapError('');
        setMapsReady(true);
        const center = selected || properties[0];
        const map = new maps.Map(mapRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: selected ? 13 : 11,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
        });

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = properties.map((property) => {
          const marker = new maps.Marker({
            position: { lat: property.lat, lng: property.lng },
            map,
            title: property.title,
          });
          marker.addListener('click', () => onSelect(property.id));
          return marker;
        });
      })
      .catch(() => {
        setMapsReady(false);
        setMapError('Google Maps no pudo cargar.');
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, onSelect, properties, selected]);

  if (apiKey && !mapError) {
    return (
      <section className="map-panel">
        <div className="map-title">
          <Map size={18} />
          <h2>Mapa</h2>
          <span>{mapsReady ? 'Google Maps' : 'Cargando'}</span>
        </div>
        <div className="google-map" ref={mapRef} />
      </section>
    );
  }

  return (
    <section className="map-panel">
      <div className="map-title">
        <Map size={18} />
        <h2>Mapa</h2>
        <span>{mapError || 'Demo'}</span>
      </div>
      <div className="fallback-map">
        <div className="route-line horizontal" />
        <div className="route-line vertical" />
        <div className="route-line diagonal" />
        {bounds
          ? properties.map((property) => (
              <button
                key={property.id}
                type="button"
                className={`map-pin ${property.id === selectedId ? 'selected' : ''}`}
                style={fallbackPosition(property, bounds)}
                onClick={() => onSelect(property.id)}
                title={property.title}
              >
                <Building size={15} />
              </button>
            ))
          : null}
        {selected ? (
          <div className="map-callout">
            <Navigation size={16} />
            <strong>{selected.zone}</strong>
            <span>{formatCurrency(selected.price, selected.operation)}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
