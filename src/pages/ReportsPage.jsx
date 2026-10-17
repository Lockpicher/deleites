import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Truck,
  Store,
  Calendar,
  Printer,
  RefreshCw,
  Award,
  CreditCard,
  Banknote,
  PieChart,
  ArrowUpRight
} from 'lucide-react';
import { insforge, TABLES, formatCurrency, formatDateTime } from '../lib/insforge';

export default function ReportsPage() {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('ALL'); // 'TODAY' | 'WEEK' | 'ALL'

  // Fetch orders and items from Insforge
  const fetchReportData = async () => {
    try {
      setLoading(true);

      const [ordersRes, itemsRes] = await Promise.all([
        insforge.database
          .from(TABLES.PEDIDOS)
          .select('*')
          .order('created_at', { ascending: false }),
        insforge.database
          .from(TABLES.PEDIDO_ITEMS)
          .select('*')
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setOrders(ordersRes.data || []);
      setOrderItems(itemsRes.data || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      if (dateFilter === 'TODAY') {
        return orderDate >= startOfToday;
      }
      if (dateFilter === 'WEEK') {
        return orderDate >= sevenDaysAgo;
      }
      return true; // ALL
    });
  }, [orders, dateFilter]);

  // KPIs
  const totalSales = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  }, [filteredOrders]);

  const totalOrdersCount = filteredOrders.length;
  const avgTicket = totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0;

  // Local vs Domicilio breakdown
  const channelBreakdown = useMemo(() => {
    let localTotal = 0;
    let localCount = 0;
    let deliveryTotal = 0;
    let deliveryCount = 0;

    filteredOrders.forEach((o) => {
      const amt = Number(o.total) || 0;
      if (o.tipo_entrega === 'DOMICILIO') {
        deliveryTotal += amt;
        deliveryCount += 1;
      } else {
        localTotal += amt;
        localCount += 1;
      }
    });

    const localPct = totalSales > 0 ? (localTotal / totalSales) * 100 : 0;
    const deliveryPct = totalSales > 0 ? (deliveryTotal / totalSales) * 100 : 0;

    return {
      localTotal,
      localCount,
      localPct,
      deliveryTotal,
      deliveryCount,
      deliveryPct
    };
  }, [filteredOrders, totalSales]);

  // Payment methods breakdown
  const paymentBreakdown = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      const method = o.metodo_pago || 'Otro';
      const amt = Number(o.total) || 0;
      if (!map[method]) map[method] = { total: 0, count: 0 };
      map[method].total += amt;
      map[method].count += 1;
    });

    return Object.entries(map).map(([method, data]) => ({
      method,
      total: data.total,
      count: data.count,
      pct: totalSales > 0 ? (data.total / totalSales) * 100 : 0
    })).sort((a, b) => b.total - a.total);
  }, [filteredOrders, totalSales]);

  // Top selling products
  const topProducts = useMemo(() => {
    // Collect order IDs from filteredOrders
    const filteredOrderIds = new Set(filteredOrders.map((o) => o.id));
    const map = {};

    orderItems.forEach((item) => {
      if (filteredOrderIds.has(item.pedido_id)) {
        const key = item.producto_nombre;
        if (!map[key]) {
          map[key] = {
            nombre: key,
            categoria: item.categoria,
            cantidad: 0,
            ingresos: 0
          };
        }
        map[key].cantidad += item.cantidad;
        map[key].ingresos += Number(item.subtotal) || (item.precio_unitario * item.cantidad);
      }
    });

    return Object.values(map)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }, [orderItems, filteredOrders]);

  const maxProductQty = topProducts.length > 0 ? topProducts[0].cantidad : 1;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-black text-white tracking-tight flex items-center gap-2">
            <span>REPORTES & CIERRE DE CAJA</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans font-bold">
              ANALÍTICA
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Métricas de ingresos, canales de venta y ranking de productos más vendidos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Selector */}
          <div className="flex items-center bg-dark-900 p-1 rounded-xl border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'TODAY'
                  ? 'bg-amber-400 text-black shadow-glow-amber'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateFilter('WEEK')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'WEEK'
                  ? 'bg-amber-400 text-black shadow-glow-amber'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'ALL'
                  ? 'bg-amber-400 text-black shadow-glow-amber'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Histórico Completo
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 border border-white/10 text-xs font-semibold"
            title="Imprimir resumen de turno"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Imprimir Cierre</span>
          </button>

          <button
            onClick={fetchReportData}
            className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 border border-white/10"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ventas Totales
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-display font-black text-amber-400">
            {formatCurrency(totalSales)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredOrders.length} transacciones registradas
          </span>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Total Orders */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total de Pedidos
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-display font-black text-white">
            {totalOrdersCount}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Despachos y consumo en sala
          </span>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Average Ticket */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ticket Promedio
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-display font-black text-emerald-400">
            {formatCurrency(avgTicket)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Valor medio por comanda
          </span>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Best Seller Highlight */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Producto Estrella
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-base font-bold text-white truncate">
            {topProducts.length > 0 ? topProducts[0].nombre : 'Sin ventas aún'}
          </p>
          <span className="text-[11px] text-purple-400 font-semibold mt-1 block">
            {topProducts.length > 0 ? `${topProducts[0].cantidad} unidades vendidas` : '-'}
          </span>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Visual Comparison: Local vs Domicilio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Domicilios vs Local Comparison (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 lg:p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-400" />
              <h2 className="font-display font-bold text-base text-white">
                Comparativa: Domicilios vs Consumo en Local
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Distribución de Ingresos
            </span>
          </div>

          {/* Graphical Progress Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded-full bg-dark-900 overflow-hidden flex p-0.5 border border-white/10">
              <div
                style={{ width: `${channelBreakdown.deliveryPct}%` }}
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-flame-600 transition-all duration-500 shadow-glow-orange"
                title={`Domicilios: ${channelBreakdown.deliveryPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${channelBreakdown.localPct}%` }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow"
                title={`En Local: ${channelBreakdown.localPct.toFixed(1)}%`}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 text-orange-400">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                Domicilios: {channelBreakdown.deliveryPct.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                En Local: {channelBreakdown.localPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Cards Breakdown Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Domicilio Box */}
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                  <Truck className="w-4 h-4" />
                  <span>Domicilios</span>
                </div>
                <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-mono font-bold">
                  {channelBreakdown.deliveryCount} pedidos
                </span>
              </div>
              <p className="text-2xl font-display font-black text-white">
                {formatCurrency(channelBreakdown.deliveryTotal)}
              </p>
              <p className="text-[11px] text-slate-400">
                Representa el {channelBreakdown.deliveryPct.toFixed(1)}% del volumen facturado.
              </p>
            </div>

            {/* Local Box */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Store className="w-4 h-4" />
                  <span>Consumo en Local</span>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                  {channelBreakdown.localCount} pedidos
                </span>
              </div>
              <p className="text-2xl font-display font-black text-white">
                {formatCurrency(channelBreakdown.localTotal)}
              </p>
              <p className="text-[11px] text-slate-400">
                Representa el {channelBreakdown.localPct.toFixed(1)}% del volumen facturado.
              </p>
            </div>
          </div>

          {/* Methods of Payment breakdown */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Desglose por Método de Pago
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {paymentBreakdown.map((pm) => (
                <div key={pm.method} className="p-2.5 rounded-xl bg-dark-900 border border-white/5">
                  <span className="text-[10px] text-slate-400 block truncate">{pm.method}</span>
                  <span className="font-display font-bold text-white text-xs block mt-0.5">
                    {formatCurrency(pm.total)}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {pm.count} ({pm.pct.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Top Selling Products List (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 lg:p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="font-display font-bold text-base text-white">
                Top Productos Más Vendidos
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Por unidades</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No hay datos de productos vendidos para este período.
            </div>
          ) : (
            <div className="space-y-3.5">
              {topProducts.map((prod, index) => {
                const percentage = maxProductQty > 0 ? (prod.cantidad / maxProductQty) * 100 : 0;

                return (
                  <div key={prod.nombre} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 max-w-[220px]">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          index === 0
                            ? 'bg-amber-400 text-black shadow-glow-amber'
                            : index === 1
                            ? 'bg-slate-300 text-black'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-dark-800 text-slate-400'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-bold text-white truncate">{prod.nombre}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-amber-400">
                          {prod.cantidad} un.
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {formatCurrency(prod.ingresos)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-dark-900 overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
