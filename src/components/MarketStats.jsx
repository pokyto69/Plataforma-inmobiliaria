import { Building2, Home, KeyRound, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '../lib/formatters.js';

export function MarketStats({ stats }) {
  const items = [
    {
      label: 'Catalogo',
      value: formatNumber(stats?.total),
      icon: Building2,
    },
    {
      label: 'Venta media',
      value: formatCurrency(stats?.averageSalePrice, 'sale'),
      icon: TrendingUp,
    },
    {
      label: 'Renta media',
      value: formatCurrency(stats?.averageRentPrice, 'rent'),
      icon: KeyRound,
    },
    {
      label: 'Zonas activas',
      value: formatNumber(stats?.topZones?.length),
      icon: Home,
    },
  ];

  return (
    <section className="stats-strip" aria-label="Indicadores de mercado">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div className="stat-item" key={item.label}>
            <Icon size={18} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        );
      })}
    </section>
  );
}
