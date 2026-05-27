export function formatCurrency(value, operation = 'sale') {
  const amount = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value || 0);

  return operation === 'rent' ? `${amount}/mes` : amount;
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-MX').format(value || 0);
}

export function typeLabel(type) {
  const labels = {
    apartment: 'Departamento',
    house: 'Casa',
    loft: 'Loft',
    penthouse: 'Penthouse',
  };
  return labels[type] || type;
}

export function operationLabel(operation) {
  return operation === 'rent' ? 'Renta' : 'Venta';
}
