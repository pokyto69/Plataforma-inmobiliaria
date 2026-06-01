import { useState, useEffect } from 'react';
import { User, LogIn, UserPlus, LogOut, FileText, ShoppingBag, Key } from 'lucide-react';
import { formatCurrency, operationLabel } from '../lib/formatters.js';

export function UserAccount({ onLoginChange, userProperties }) {
  const [user, setUser] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('transactions'); // 'transactions' | 'listings'
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('habitatIqUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      onLoginChange(parsed);
    }
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('habitatIqStorageUpdate', handleUpdate);
    return () => window.removeEventListener('habitatIqStorageUpdate', handleUpdate);
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !email || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('habitatIqUsers') || '[]');
    if (users.find(u => u.username === username || u.email === email)) {
      setError('El usuario o correo ya existe.');
      return;
    }

    const newUser = { username, email, password };
    users.push(newUser);
    localStorage.setItem('habitatIqUsers', JSON.stringify(users));

    setSuccess('Registro exitoso. ¡Inicia sesión ahora!');
    setIsRegister(false);
    setPassword('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const users = JSON.parse(localStorage.getItem('habitatIqUsers') || '[]');
    const found = users.find(u => u.username === username && u.password === password);

    if (!found) {
      setError('Usuario o contraseña incorrectos.');
      return;
    }

    const sessionUser = { username: found.username, email: found.email };
    setUser(sessionUser);
    localStorage.setItem('habitatIqUser', JSON.stringify(sessionUser));
    onLoginChange(sessionUser);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('habitatIqUser');
    onLoginChange(null);
  };

  // Get transactions (bought or rented properties)
  const getTransactions = () => {
    if (!user) return [];
    const allTx = JSON.parse(localStorage.getItem(`tx_${user.username}`) || '[]');
    return allTx;
  };

  const transactions = getTransactions();
  // Filter user properties (published by this logged-in user)
  // We can match property.owner.email with user.email or property.owner.name with user.username
  const listings = userProperties.filter(p => p.owner?.email === user?.email || p.owner?.name === user?.username);

  if (!user) {
    return (
      <section className="account-section glass-panel">
        <div className="account-card">
          <div className="panel-title">
            {isRegister ? <UserPlus size={20} /> : <LogIn size={20} />}
            <h2>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
          </div>

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="account-form">
            <label className="field">
              <span>Usuario</span>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </label>

            {isRegister && (
              <label className="field">
                <span>Correo Electrónico</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </label>
            )}

            <label className="field">
              <span>Contraseña</span>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </label>

            <button type="submit" className="estimate-button">
              <span>{isRegister ? 'Registrarse' : 'Ingresar'}</span>
            </button>

            {error && <p className="inline-alert">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <div className="account-toggle">
              <button 
                type="button" 
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                  setSuccess('');
                }}
                className="link-button"
              >
                {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Registrate'}
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="account-dashboard glass-panel">
      <header className="dashboard-header">
        <div className="user-profile-info">
          <div className="user-avatar">
            <User size={24} />
          </div>
          <div>
            <h3>Bienvenido, {user.username}</h3>
            <span>{user.email}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="icon-button danger logout-btn">
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={tab === 'transactions' ? 'active' : ''} 
          onClick={() => setTab('transactions')}
        >
          <ShoppingBag size={16} />
          <span>Compras y Rentas ({transactions.length})</span>
        </button>
        <button 
          className={tab === 'listings' ? 'active' : ''} 
          onClick={() => setTab('listings')}
        >
          <FileText size={16} />
          <span>Mis Ventas/Rentas Publicadas ({listings.length})</span>
        </button>
      </nav>

      <div className="dashboard-content">
        {tab === 'transactions' ? (
          <div className="dashboard-list">
            <h4>Propiedades Adquiridas / Interesado</h4>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <article className="tx-card" key={tx.id}>
                  <img src={tx.imageUrl} alt={tx.title} />
                  <div className="tx-info">
                    <span className={`status ${tx.operation}`}>
                      {tx.operation === 'sale' ? 'Comprado' : 'Rentado'}
                    </span>
                    <h5>{tx.title}</h5>
                    <strong>{formatCurrency(tx.price, tx.operation)}</strong>
                    <small>{tx.zone}, {tx.city}</small>
                    <div className="tx-date">Adquirido el: {new Date(tx.txDate).toLocaleDateString()}</div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">No has adquirido ninguna propiedad aún. Puedes ir al panel del Comprador, seleccionar una propiedad y hacer clic en "Me interesa".</div>
            )}
          </div>
        ) : (
          <div className="dashboard-list">
            <h4>Tus Publicaciones Activas</h4>
            {listings.length > 0 ? (
              listings.map((item) => (
                <article className="tx-card" key={item.id}>
                  <img src={item.imageUrl} alt={item.title} />
                  <div className="tx-info">
                    <span className={`status ${item.operation}`}>{operationLabel(item.operation)}</span>
                    <h5>{item.title}</h5>
                    <strong>{formatCurrency(item.price, item.operation)}</strong>
                    <small>{item.zone}, {item.city}</small>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">No tienes publicaciones activas. Ve al panel de Vendedor para publicar una propiedad.</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
