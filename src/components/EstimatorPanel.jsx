import { useEffect, useState } from 'react';
import { Calculator, Home, Loader2, WandSparkles } from 'lucide-react';
import { apiPost } from '../lib/api.js';
import { formatCurrency, typeLabel } from '../lib/formatters.js';

const initialForm = {
  operation: 'sale',
  type: 'apartment',
  city: 'Ciudad de Mexico',
  zone: 'Narvarte',
  areaM2: 90,
  bedrooms: 2,
  bathrooms: 2,
  parking: 1,
  age: 8,
  amenities: ['Vigilancia'],
};

const amenityOptions = ['Terraza', 'Jardin', 'Alberca', 'Gimnasio', 'Vigilancia', 'Elevador', 'Coworking'];

export function EstimatorPanel({ selectedProperty, options }) {
  const [form, setForm] = useState(initialForm);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedProperty) return;
    setForm((current) => ({
      ...current,
      operation: selectedProperty.operation,
      type: selectedProperty.type,
      city: selectedProperty.city,
      zone: selectedProperty.zone,
      areaM2: selectedProperty.areaM2,
      bedrooms: selectedProperty.bedrooms,
      bathrooms: Math.round(selectedProperty.bathrooms),
      parking: selectedProperty.parking,
      age: selectedProperty.age,
      amenities: selectedProperty.amenities.slice(0, 3),
    }));
  }, [selectedProperty]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleAmenity = (amenity) => {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = await apiPost('/api/valuation/estimate', form);
      setEstimate(payload.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="estimator-panel">
      <div className="panel-title">
        <Calculator size={18} />
        <h2>Valuador</h2>
      </div>

      <form onSubmit={submit}>
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
              {['apartment', 'house', 'loft', 'penthouse'].map((type) => (
                <option key={type} value={type}>
                  {typeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Zona</span>
            <select value={form.zone} onChange={(event) => update('zone', event.target.value)}>
              {options.zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>m2</span>
            <input
              type="number"
              min="25"
              max="1200"
              value={form.areaM2}
              onChange={(event) => update('areaM2', event.target.value)}
            />
          </label>
          <label className="field">
            <span>Antiguedad</span>
            <input
              type="number"
              min="0"
              max="80"
              value={form.age}
              onChange={(event) => update('age', event.target.value)}
            />
          </label>
        </div>

        <div className="field-row three">
          <label className="field">
            <span>Rec.</span>
            <input
              type="number"
              min="0"
              max="8"
              value={form.bedrooms}
              onChange={(event) => update('bedrooms', event.target.value)}
            />
          </label>
          <label className="field">
            <span>Banos</span>
            <input
              type="number"
              min="1"
              max="8"
              value={form.bathrooms}
              onChange={(event) => update('bathrooms', event.target.value)}
            />
          </label>
          <label className="field">
            <span>Autos</span>
            <input
              type="number"
              min="0"
              max="6"
              value={form.parking}
              onChange={(event) => update('parking', event.target.value)}
            />
          </label>
        </div>

        <div className="amenity-grid">
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

        <button type="submit" className="estimate-button" disabled={loading}>
          {loading ? <Loader2 className="spin" size={18} /> : <WandSparkles size={18} />}
          <span>Estimar</span>
        </button>
      </form>

      {error ? <p className="inline-alert">{error}</p> : null}

      {estimate ? (
        <section className="estimate-result">
          <div>
            <span>Rango estimado</span>
            <strong>{formatCurrency(estimate.estimate, estimate.operation)}</strong>
            <small>
              {formatCurrency(estimate.low, estimate.operation)} - {formatCurrency(estimate.high, estimate.operation)}
            </small>
          </div>
          <div className="confidence">
            <Home size={17} />
            <span>{estimate.confidence}%</span>
          </div>
        </section>
      ) : null}
    </aside>
  );
}
