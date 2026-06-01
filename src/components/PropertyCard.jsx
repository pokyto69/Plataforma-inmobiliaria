import { Bath, BedDouble, Car, MapPin, Ruler, ShieldCheck } from 'lucide-react';
import { formatCurrency, operationLabel, typeLabel } from '../lib/formatters.js';

export function PropertyCard({ property, selected, onSelect }) {
  return (
    <article className={`property-card ${selected ? 'selected' : ''}`}>
      <button type="button" className="card-hit" onClick={() => onSelect(property.id)} aria-label={property.title}>
        <img src={property.imageUrl} alt={property.title} loading="lazy" />
        <div className="property-body">
          <div className="property-head">
            <div>
              <span className={`status ${property.operation}`}>{operationLabel(property.operation)}</span>
              {property.status === 'pending' && (
                <span className="status pending" style={{ background: '#d97706', color: '#fff', marginLeft: '6px' }}>
                  En proceso de venta
                </span>
              )}
              <h3>{property.title}</h3>
            </div>
            <strong>{formatCurrency(property.price, property.operation)}</strong>
          </div>

          <p className="address">
            <MapPin size={15} />
            {property.zone}, {property.city}
          </p>

          <div className="facts">
            <span>
              <Ruler size={15} />
              {property.areaM2} m2
            </span>
            <span>
              <BedDouble size={15} />
              {property.bedrooms}
            </span>
            <span>
              <Bath size={15} />
              {property.bathrooms}
            </span>
            <span>
              <Car size={15} />
              {property.parking}
            </span>
          </div>

          <div className="tag-row">
            <span>{typeLabel(property.type)}</span>
            <span>
              <ShieldCheck size={14} />
              {property.score}
            </span>
            {property.distanceKm ? <span>{property.distanceKm} km</span> : null}
          </div>
        </div>
      </button>
    </article>
  );
}
