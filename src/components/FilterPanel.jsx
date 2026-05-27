import { Crosshair, RotateCcw, Search } from 'lucide-react';

const typeOptions = [
  { value: 'all', label: 'Todo' },
  { value: 'apartment', label: 'Depto' },
  { value: 'house', label: 'Casa' },
  { value: 'loft', label: 'Loft' },
  { value: 'penthouse', label: 'PH' },
];

export function FilterPanel({
  filters,
  options,
  onChange,
  onLocate,
  onReset,
  locating,
  locationError,
}) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <aside className="filters-panel">
      <div className="panel-title">
        <Search size={18} />
        <h2>Busqueda</h2>
      </div>

      <div className="field-group">
        <span className="label">Operacion</span>
        <div className="segmented">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'sale', label: 'Venta' },
            { value: 'rent', label: 'Renta' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={filters.operation === option.value ? 'active' : ''}
              onClick={() => update('operation', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <span className="label">Tipo</span>
        <div className="segmented compact">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={filters.type === option.value ? 'active' : ''}
              onClick={() => update('type', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Ciudad</span>
        <select value={filters.city} onChange={(event) => update('city', event.target.value)}>
          <option value="all">Todas</option>
          {options.cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Zona</span>
        <input
          value={filters.zone}
          onChange={(event) => update('zone', event.target.value)}
          placeholder="Polanco, Roma Norte"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Minimo</span>
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(event) => update('minPrice', event.target.value)}
          />
        </label>
        <label className="field">
          <span>Maximo</span>
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(event) => update('maxPrice', event.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span>Recamaras</span>
        <select value={filters.bedrooms} onChange={(event) => update('bedrooms', event.target.value)}>
          <option value="">Cualquiera</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </label>

      <div className="panel-actions">
        <button type="button" className="icon-button accent" onClick={onLocate} disabled={locating} title="Cerca de mi">
          <Crosshair size={18} />
          <span>Cerca de mi</span>
        </button>
        <button type="button" className="icon-button neutral" onClick={onReset} title="Restablecer">
          <RotateCcw size={18} />
          <span>Limpiar</span>
        </button>
      </div>

      {locationError ? <p className="inline-alert">{locationError}</p> : null}
    </aside>
  );
}
