import { createClient } from '@insforge/sdk';

export const INSFORGE_BASE_URL = 'https://insforge.kora.ovh';
export const INSFORGE_ANON_KEY = 'ik_2068688a89f5cd89cc7e009fc8e9c65100c59346';

export const insforge = createClient({
  baseUrl: INSFORGE_BASE_URL,
  anonKey: INSFORGE_ANON_KEY
});

export const TABLES = {
  CLIENTES: 'deleites_clientes',
  PRODUCTOS: 'deleites_productos',
  PEDIDOS: 'deleites_pedidos',
  PEDIDO_ITEMS: 'deleites_pedido_items'
};

export const ORDER_STATUSES = [
  { id: 'Pendiente', label: 'Pendiente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', badge: '🟡' },
  { id: 'En Cocina', label: 'En Cocina', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40', badge: '🔥' },
  { id: 'En Camino', label: 'En Camino', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', badge: '🛵' },
  { id: 'Entregado', label: 'Entregado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', badge: '✅' },
  { id: 'Cancelado', label: 'Cancelado', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40', badge: '❌' }
];

export const PAYMENT_METHODS = [
  'Efectivo',
  'Nequi / Daviplata',
  'Tarjeta / Datáfono',
  'Transferencia'
];

export const CATEGORIES = [
  'Hamburguesas',
  'Perros & Salchipapas',
  'Acompañamientos',
  'Combos',
  'Bebidas'
];

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(num);
}

export function formatDateTime(isoString) {
  if (!isoString) return 'Sin fecha';
  const d = new Date(isoString);
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function timeAgo(isoString) {
  if (!isoString) return 'Nunca';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}
