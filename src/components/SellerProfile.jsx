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

export function SellerProfile({ listings, onCreated }) {
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
            <span>Rec.</span>
            <input type="number" min="0" value={form.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} />
          </label>
          <label className="field">
            <span>Banos</span>
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

        <label className="field">
          <span>Foto URL</span>
          <input value={form.imageUrl} onChange={(event) => update('imageUrl', event.target.value)} />
        </label>

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
              <article className="owner-card" key={property.id}>
                <img src={property.imageUrl} alt={property.title} />
                <div>
                  <span>{operationLabel(property.operation)}</span>
                  <h3>{property.title}</h3>
                  <strong>{formatCurrency(property.price, property.operation)}</strong>
                  <small>
                    {property.zone}, {property.city}
                  </small>
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
