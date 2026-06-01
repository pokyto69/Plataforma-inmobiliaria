import { useEffect, useMemo, useState } from 'react';
import { Building2, RefreshCw, ShieldCheck, UserRoundCheck, WalletCards, User } from 'lucide-react';
import { EstimatorPanel } from './components/EstimatorPanel.jsx';
import { FilterPanel } from './components/FilterPanel.jsx';
import { MapPanel } from './components/MapPanel.jsx';
import { MarketStats } from './components/MarketStats.jsx';
import { PropertyCard } from './components/PropertyCard.jsx';
import { SellerProfile } from './components/SellerProfile.jsx';
import { UserAccount } from './components/UserAccount.jsx';
import { useProperties } from './hooks/useProperties.js';
import { apiGet } from './lib/api.js';

const initialFilters = {
  operation: 'all',
  type: 'all',
  city: 'all',
  zone: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  lat: '',
  lng: '',
  radiusKm: '',
};

function App() {
  const [profile, setProfile] = useState('buyer');
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState('');
  const [stats, setStats] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const { properties, meta, loading, error } = useProperties(filters, refreshKey);

  const loadStats = () => {
    apiGet('/api/properties/stats')
      .then((payload) => setStats(payload.data))
      .catch(() => setStats(null));
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (properties.length && !properties.some((property) => property.id === selectedId)) {
      setSelectedId(properties[0].id);
    }
  }, [properties, selectedId]);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedId) || properties[0],
    [properties, selectedId],
  );

  const locate = () => {
    if (!navigator.geolocation) {
      setLocationError('Ubicacion no disponible en este navegador.');
      return;
    }

    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFilters((current) => ({
          ...current,
          lat: coords.latitude.toFixed(6),
          lng: coords.longitude.toFixed(6),
          radiusKm: '25',
        }));
        setLocating(false);
      },
      () => {
        setLocationError('No se pudo obtener la ubicacion.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setLocationError('');
  };

  const handlePropertyCreated = (property) => {
    setFilters(initialFilters);
    setSelectedId(property.id);
    setRefreshKey((current) => current + 1);
    loadStats();
  };

  const ownerListings = useMemo(
    () => properties.filter((property) => property.source === 'user'),
    [properties],
  );

  return (
    <main className="app-frame">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">
            <Building2 size={24} />
          </div>
          <div>
            <h1>HabitatIQ</h1>
            <span>Plataforma inmobiliaria inteligente</span>
          </div>
        </div>
        <div className="header-status">
          <ShieldCheck size={18} />
          <span>API segura</span>
        </div>
      </header>

      <nav className="profile-switch" aria-label="Perfil">
        <button
          type="button"
          className={profile === 'buyer' ? 'active' : ''}
          onClick={() => setProfile('buyer')}
        >
          <WalletCards size={18} />
          <span>Comprador</span>
        </button>
        <button
          type="button"
          className={profile === 'seller' ? 'active' : ''}
          onClick={() => setProfile('seller')}
        >
          <UserRoundCheck size={18} />
          <span>Vendedor</span>
        </button>
        <button
          type="button"
          className={profile === 'account' ? 'active' : ''}
          onClick={() => setProfile('account')}
        >
          <User size={18} />
          <span>{currentUser ? `Cuenta (${currentUser.username})` : 'Mi Cuenta'}</span>
        </button>
      </nav>

      <MarketStats stats={stats} />

      {profile === 'seller' && (
        <SellerProfile listings={ownerListings} onCreated={handlePropertyCreated} />
      )}
      {profile === 'account' && (
        <UserAccount onLoginChange={setCurrentUser} userProperties={properties} />
      )}
      {profile === 'buyer' && (
        <section className="workspace-grid">
          <FilterPanel
            filters={filters}
            options={meta.options}
            onChange={setFilters}
            onLocate={locate}
            onReset={resetFilters}
            locating={locating}
            locationError={locationError}
          />

          <section className="results-pane">
            <div className="results-head">
              <div>
                <h2>Inmuebles</h2>
                <span>{meta.total} disponibles</span>
              </div>
              {loading ? (
                <span className="loading-chip">
                  <RefreshCw className="spin" size={16} />
                  Cargando
                </span>
              ) : null}
            </div>

            {error ? <p className="inline-alert">{error}</p> : null}

            <div className="property-list">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  selected={property.id === selectedId}
                  onSelect={setSelectedId}
                />
              ))}
              {!loading && !properties.length ? <div className="empty-list">Sin resultados</div> : null}
            </div>
          </section>

          <section className="insights-pane">
            <MapPanel properties={properties} selectedId={selectedId} onSelect={setSelectedId} />
            <EstimatorPanel selectedProperty={selectedProperty} options={meta.options} />
          </section>
        </section>
      )}
    </main>
  );
}

export default App;
