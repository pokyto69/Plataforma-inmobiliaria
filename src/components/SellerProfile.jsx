import { useState } from 'react';
import { Crosshair, Home, Loader2, PlusCircle, UserRoundCheck } from 'lucide-react';
import { apiPost } from '../lib/api.js';
import { formatCurrency, operationLabel, typeLabel } from '../lib/formatters.js';

const initialListing = {
  title: '',
  operation: 'sale',
  type: 'house',
  city: 'Ciudad de Mexico',
  zone: '',
  address: '',
  price: '',
  areaM2: '',
  bedrooms: 3,
  bathrooms: 2,
  parking: 1,
  age: 0,
  lat: '19.4326',
  lng: '-99.1332',
  imageUrl: '',
  description: '',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  amenities: ['Vigilancia'],
};

const amenityOptions = ['Terraza', 'Jardin', 'Alberca', 'Gimnasio', 'Vigilancia', 'Elevador', 'Bodega', 'Paneles solares'];

export function SellerProfile({ listings, onCreated, onRefresh }) {
  const [form, setForm] = useState(initialListing);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleAmenity = (amenity) => {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setError('Ubicacion no disponible en este navegador.');
      return;
    }

    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        update('lat', coords.latitude.toFixed(6));
        update('lng', coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setError('No se pudo obtener la ubicacion.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = await apiPost('/api/properties', form);
      setMessage('Inmueble publicado.');
      setForm(initialListing);
      onCreated(payload.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await apiPost(`/api/properties/${id}/confirm`);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      await apiPost(`/api/properties/${id}/cancel-request`);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <section className="seller-workspace">
      <form className="seller-form" onSubmit={submit}>
        <div className="panel-title">
          <Home size={18} />
          <h2>Publicar inmueble</h2>
        </div>

        <label className="field">
          <span>Titulo</span>
          <input value={form.title} onChange={(event) => update('title', event.target.value)} required />
        </label>

        <div className="field-group">
          <span className="label">Operacion</span>
          <div className="segmented">
            {[
              { value: 'sale', label: 'Venta' },
              { value: 'rent', label: 'Renta' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={form.operation === option.value ? 'active' : ''}
                onClick={() => update('operation', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Tipo</span>
            <select value={form.type} onChange={(event) => update('type', event.target.value)}>
              {['house', 'apartment', 'loft', 'penthouse'].map((type) => (
                <option key={type} value={type}>
                  {typeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Precio</span>
            <input type="number" min="1" value={form.price} onChange={(event) => update('price', event.target.value)} required />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Ciudad</span>
            <input value={form.city} onChange={(event) => update('city', event.target.value)} required />
          </label>
          <label className="field">
            <span>Zona</span>
            <input value={form.zone} onChange={(event) => update('zone', event.target.value)} required />
          </label>
        </div>

        <label className="field">
          <span>Direccion</span>
          <input value={form.address} onChange={(event) => update('address', event.target.value)} />
        </label>

        <div className="field-row three">
          <label className="field">
            <span>m2</span>
            <input type="number" min="15" value={form.areaM2} onChange={(event) => update('areaM2', event.target.value)} required />
          </label>
          <label className="field">
            <span>Recamaras</span>
            <input type="number" min="0" value={form.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} />
          </label>
          <label className="field">
            <span>Baños</span>
            <input type="number" min="1" value={form.bathrooms} onChange={(event) => update('bathrooms', event.target.value)} />
          </label>
        </div>

        <div className="field-row three">
          <label className="field">
            <span>Autos</span>
            <input type="number" min="0" value={form.parking} onChange={(event) => update('parking', event.target.value)} />
          </label>
          <label className="field">
            <span>Anos</span>
            <input type="number" min="0" value={form.age} onChange={(event) => update('age', event.target.value)} />
          </label>
          <button type="button" className="icon-button neutral location-button" onClick={locate} disabled={locating}>
            <Crosshair size={17} />
            <span>Ubicacion</span>
          </button>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Latitud</span>
            <input value={form.lat} onChange={(event) => update('lat', event.target.value)} />
          </label>
          <label className="field">
            <span>Longitud</span>
            <input value={form.lng} onChange={(event) => update('lng', event.target.value)} />
          </label>
        </div>

        <div className="field">
          <span>Foto del Inmueble</span>
          <div style={{ display: 'grid', gap: '8px' }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  update('imageUrl', event.target.result);
                };
                reader.readAsDataURL(file);
              }}
              style={{ border: 'none', padding: '0', background: 'transparent', height: 'auto' }}
            />
            {form.imageUrl && (
              <div style={{ position: 'relative', width: '100%', height: '120px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--line)' }}>
                <img src={form.imageUrl} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => update('imageUrl', '')}
                  style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}
                >
                  Quitar
                </button>
              </div>
            )}
            <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'none' }}>O introduce una URL de imagen externa:</span>
            <input value={form.imageUrl} onChange={(event) => update('imageUrl', event.target.value)} placeholder="https://images.unsplash.com/..." />
          </div>
        </div>

        <label className="field">
          <span>Descripcion</span>
          <textarea value={form.description} onChange={(event) => update('description', event.target.value)} />
        </label>

        <div className="amenity-grid seller-amenities">
          {amenityOptions.map((amenity) => (
            <label key={amenity} className="check-pill">
              <input
                type="checkbox"
                checked={form.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
              />
              <span>{amenity}</span>
            </label>
          ))}
        </div>

        <div className="field-row">
          <label className="field">
            <span>Nombre</span>
            <input value={form.ownerName} onChange={(event) => update('ownerName', event.target.value)} />
          </label>
          <label className="field">
            <span>Telefono</span>
            <input value={form.ownerPhone} onChange={(event) => update('ownerPhone', event.target.value)} />
          </label>
        </div>

        <label className="field">
          <span>Correo</span>
          <input type="email" value={form.ownerEmail} onChange={(event) => update('ownerEmail', event.target.value)} />
        </label>

        <button type="submit" className="estimate-button" disabled={saving}>
          {saving ? <Loader2 className="spin" size={18} /> : <PlusCircle size={18} />}
          <span>Publicar</span>
        </button>

        {message ? <p className="success-message">{message}</p> : null}
        {error ? <p className="inline-alert">{error}</p> : null}
      </form>

      <aside className="seller-listings">
        <div className="panel-title">
          <UserRoundCheck size={18} />
          <h2>Mis publicaciones</h2>
        </div>

        <div className="owner-list">
          {listings.length ? (
            listings.map((property) => (
              <article className="owner-card" key={property.id} style={{ display: 'flex', flexDirection: 'column', height: 'auto', minHeight: 'auto' }}>
                <img src={property.imageUrl} alt={property.title} style={{ height: '140px', objectFit: 'cover' }} />
                <div style={{ padding: '14px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`status ${property.operation}`}>{operationLabel(property.operation)}</span>
                      {property.status === 'pending' && (
                        <span className="status pending" style={{ background: '#d97706', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', textTransform: 'none' }}>
                          Venta en proceso
                        </span>
                      )}
                      {property.status === 'sold' && (
                        <span className="status sold" style={{ background: '#64748b', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', textTransform: 'none' }}>
                          Vendido
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: '8px 0 4px', fontSize: '15px' }}>{property.title}</h3>
                    <strong style={{ display: 'block', fontSize: '16px', color: 'var(--blue)', marginBottom: '4px' }}>
                      {formatCurrency(property.price, property.operation)}
                    </strong>
                    <small style={{ color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                      {property.zone}, {property.city}
                    </small>
                  </div>

                  {property.requests && property.requests.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--line)', marginTop: '12px', paddingTop: '12px' }}>
                      <h4 style={{ fontSize: '12px', margin: '0 0 8px', color: 'var(--ink)', fontWeight: '600' }}>Solicitudes de adquisición:</h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {property.requests.map((req, idx) => (
                          <div key={idx} style={{ background: 'var(--surface-hover)', padding: '8px', borderRadius: '6px', fontSize: '11px', border: '1px solid var(--line)' }}>
                            <div style={{ fontWeight: '600', color: 'var(--ink)' }}>{req.buyerName}</div>
                            <div style={{ color: 'var(--muted)', margin: '2px 0' }}>Tel: {req.buyerPhone || 'N/A'} | Correo: {req.buyerEmail}</div>
                            <p style={{ margin: '4px 0 0', fontStyle: 'italic', color: '#475569' }}>"{req.message}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {property.status === 'pending' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => handleConfirm(property.id)}
                        style={{ height: '32px', background: 'var(--jade)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Confirmar Venta
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(property.id)}
                        style={{ height: '32px', background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-list">Sin publicaciones</div>
          )}
        </div>
      </aside>
    </section>
  );
}
