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
  const [txMessage, setTxMessage] = useState('');
  const [txError, setTxError] = useState('');

  useEffect(() => {
    setTxMessage('');
    setTxError('');
  }, [selectedProperty]);

  const handleAcquire = () => {
    setTxMessage('');
    setTxError('');
    const savedUser = localStorage.getItem('habitatIqUser');
    if (!savedUser) {
      setTxError('Inicia sesión en la pestaña "Mi Cuenta" para comprar o rentar.');
      return;
    }

    const userObj = JSON.parse(savedUser);
    const userTxKey = `tx_${userObj.username}`;
    const currentTx = JSON.parse(localStorage.getItem(userTxKey) || '[]');
    
    if (currentTx.find(t => t.id === selectedProperty.id)) {
      setTxError('Ya has adquirido esta propiedad.');
      return;
    }

    const newTx = {
      id: selectedProperty.id,
      title: selectedProperty.title,
      price: selectedProperty.price,
      operation: selectedProperty.operation,
      zone: selectedProperty.zone,
      city: selectedProperty.city,
      imageUrl: selectedProperty.imageUrl,
      txDate: new Date().toISOString(),
    };

    currentTx.push(newTx);
    localStorage.setItem(userTxKey, JSON.stringify(currentTx));
    setTxMessage(`¡Felicidades! Has ${selectedProperty.operation === 'sale' ? 'comprado' : 'rentado'} esta propiedad.`);
    window.dispatchEvent(new Event('habitatIqStorageUpdate'));
  };

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

      {selectedProperty && (
        <div className="selected-property-tx glass-panel" style={{ marginBottom: '20px', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255, 255, 255, 0.03)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '6px', color: '#fff', fontWeight: '600' }}>Adquirir Inmueble</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.4' }}>
            ¿Te interesa este inmueble? Puedes adquirirlo o rentarlo directamente.
          </p>
          <button 
            type="button" 
            onClick={handleAcquire} 
            className="estimate-button" 
            style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', height: '40px', fontSize: '0.9rem' }}
          >
            <span>{selectedProperty.operation === 'sale' ? 'Comprar Propiedad' : 'Rentar Propiedad'}</span>
          </button>
          {txMessage && <p className="success-message" style={{ marginTop: '10px', fontSize: '0.85rem', color: '#10b981' }}>{txMessage}</p>}
          {txError && <p className="inline-alert" style={{ marginTop: '10px', fontSize: '0.85rem', color: '#f43f5e' }}>{txError}</p>}
        </div>
      )}

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
