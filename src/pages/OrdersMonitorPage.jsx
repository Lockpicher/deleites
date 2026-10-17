import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  X,
  Truck,
  Store,
  ChefHat,
  PackageCheck
} from 'lucide-react';
import { insforge, TABLES, ORDER_STATUSES, formatCurrency, formatDateTime, timeAgo } from '../lib/insforge';

const COLUMNS = [
  { id: 'Pendiente', title: 'Pendiente', icon: Clock, color: 'border-amber-500/50 text-amber-400 bg-amber-500/10' },
  { id: 'En Cocina', title: 'En Cocina', icon: ChefHat, color: 'border-orange-500/50 text-orange-400 bg-orange-500/10' },
  { id: 'En Camino', title: 'En Camino', icon: Truck, color: 'border-blue-500/50 text-blue-400 bg-blue-500/10' },
  { id: 'Entregado', title: 'Entregado', icon: PackageCheck, color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' }
];

export default function OrdersMonitorPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'LOCAL' | 'DOMICILIO'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mobileActiveCol, setMobileActiveCol] = useState('ALL'); // 'ALL' or specific column id

  // Fetch orders from Insforge
  const fetchOrders = async () => {
    try {
      const { data, error } = await insforge.database
        .from(TABLES.PEDIDOS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Real-time polling interval
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchOrders();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Update order status in Insforge
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const { error } = await insforge.database
        .from(TABLES.PEDIDOS)
        .update({
          estado: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Optimistic state update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, estado: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, estado: newStatus }));
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Error actualizando estado en Insforge: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, orderId) => {
    e.dataTransfer.setData('text/plain', orderId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain');
    if (orderId) {
      handleUpdateStatus(orderId, targetStatus);
    }
  };

  // Next and previous status helpers
  const getNextStatus = (current) => {
    switch (current) {
      case 'Pendiente':
        return 'En Cocina';
      case 'En Cocina':
        return 'En Camino';
      case 'En Camino':
        return 'Entregado';
      default:
        return null;
    }
  };

  const getPrevStatus = (current) => {
    switch (current) {
      case 'Entregado':
        return 'En Camino';
      case 'En Camino':
        return 'En Cocina';
      case 'En Cocina':
        return 'Pendiente';
      default:
        return null;
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      filterType === 'ALL' || order.tipo_entrega === filterType;
    const matchesSearch =
      order.codigo_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente_telefono.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-black text-white tracking-tight flex items-center gap-2">
            <span>MONITOR DE OPERACIÓN</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans font-bold">
              TABLERO KANBAN
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Arrastra tarjetas o usa los botones de avance para actualizar el estado en cocina y despacho.
          </p>
        </div>

        {/* Filter and Live Polling controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Delivery Type Filters */}
          <div className="flex items-center bg-dark-900 p-1 rounded-xl border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'ALL'
                  ? 'bg-amber-400 text-black shadow-glow-amber'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              onClick={() => setFilterType('LOCAL')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterType === 'LOCAL'
                  ? 'bg-emerald-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Local</span>
            </button>
            <button
              onClick={() => setFilterType('DOMICILIO')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterType === 'DOMICILIO'
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Domicilio</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar #orden, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-dark-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-44"
            />
          </div>

          {/* Refresh button with status indicator */}
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 border border-white/10 text-xs font-semibold"
            title="Refrescar datos de Insforge"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Mobile Column Tabs (Visible on small screens) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setMobileActiveCol('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            mobileActiveCol === 'ALL'
              ? 'bg-amber-400 text-black shadow-glow-amber'
              : 'bg-dark-900 text-slate-300 border border-white/5'
          }`}
        >
          Todas ({filteredOrders.length})
        </button>
        {COLUMNS.map((col) => {
          const count = filteredOrders.filter((o) => o.estado === col.id).length;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileActiveCol(col.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                mobileActiveCol === col.id
                  ? 'bg-amber-400 text-black shadow-glow-amber'
                  : 'bg-dark-900 text-slate-300 border border-white/5'
              }`}
            >
              <span>{col.title}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                mobileActiveCol === col.id ? 'bg-black text-amber-400' : 'bg-dark-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.estado === col.id);
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`${
                mobileActiveCol === 'ALL' || mobileActiveCol === col.id
                  ? 'flex'
                  : 'hidden md:flex'
              } glass-panel rounded-2xl border border-white/10 p-3 min-h-[500px] flex-col transition-colors`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${col.color}`}>
                    <ColIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-white tracking-wide">
                    {col.title}
                  </h3>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-dark-800 text-slate-300 border border-white/10">
                  {colOrders.length}
                </span>
              </div>

              {/* Order Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-1">
                {colOrders.length === 0 ? (
                  <div className="h-44 border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-slate-600 text-xs">
                    <p>No hay pedidos {col.title.toLowerCase()}s</p>
                    <p className="text-[10px] text-slate-700 mt-1">Arrastra aquí para mover</p>
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const isDelivery = order.tipo_entrega === 'DOMICILIO';
                    const nextSt = getNextStatus(order.estado);
                    const prevSt = getPrevStatus(order.estado);
                    const isUpdating = updatingId === order.id;

                    return (
                      <div
                        key={order.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order.id)}
                        className={`group relative rounded-xl bg-dark-900 hover:bg-dark-850 border border-white/10 hover:border-amber-500/40 p-3.5 shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
                          isUpdating ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {/* Card Top: Code + Delivery Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-display font-black text-sm text-white tracking-tight">
                            {order.codigo_pedido}
                          </span>

                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isDelivery
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            }`}
                          >
                            {isDelivery ? <Truck className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                            <span>{order.tipo_entrega}</span>
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-1 mb-2.5 text-xs">
                          <div className="font-semibold text-slate-200 truncate flex items-center justify-between">
                            <span>{order.cliente_nombre}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {timeAgo(order.created_at)}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{order.cliente_telefono}</span>
                          </div>

                          {isDelivery && order.direccion_entrega && (
                            <div className="text-[11px] text-slate-400 flex items-start gap-1">
                              <MapPin className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{order.direccion_entrega}</span>
                            </div>
                          )}
                        </div>

                        {/* Order Items Preview */}
                        <div className="p-2 rounded-lg bg-dark-950/70 border border-white/5 text-xs text-slate-300 mb-3">
                          <p className="line-clamp-2 text-[11px]">
                            {order.items_resumen || 'Detalle no disponible'}
                          </p>
                          {order.notas && (
                            <p className="text-[10px] text-amber-400 italic mt-1 border-t border-white/5 pt-1">
                              Nota: {order.notas}
                            </p>
                          )}
                        </div>

                        {/* Total & Payment Method */}
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="text-slate-400 text-[11px]">{order.metodo_pago}</span>
                          <span className="font-display font-bold text-amber-400 text-sm">
                            {formatCurrency(order.total)}
                          </span>
                        </div>

                        {/* Workflow Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-1.5">
                            {prevSt && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, prevSt)}
                                className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                                title={`Regresar a ${prevSt}`}
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}

                            {nextSt && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, nextSt)}
                                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-[11px] flex items-center gap-1 transition-colors shadow"
                              >
                                <span>{nextSt}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Full Order Details */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-2xl border border-white/10 shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-4 pr-8">
              <div>
                <span className="text-xs text-amber-400 font-bold tracking-wider uppercase">
                  Ficha de Pedido
                </span>
                <h3 className="text-2xl font-display font-black text-white">
                  {selectedOrder.codigo_pedido}
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  selectedOrder.tipo_entrega === 'DOMICILIO'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {selectedOrder.tipo_entrega}
              </span>
            </div>

            {/* Customer Details */}
            <div className="p-3.5 rounded-xl bg-dark-900 border border-white/5 space-y-1.5 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="font-bold text-white">{selectedOrder.cliente_nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teléfono:</span>
                <span className="font-mono text-slate-200">{selectedOrder.cliente_telefono}</span>
              </div>
              {selectedOrder.direccion_entrega && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Dirección:</span>
                  <span className="text-slate-200 text-right">{selectedOrder.direccion_entrega}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Hora de Registro:</span>
                <span className="text-slate-200">{formatDateTime(selectedOrder.created_at)}</span>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-3.5 rounded-xl bg-dark-900 border border-white/5 text-xs space-y-2 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Resumen de Productos
              </span>
              <p className="text-slate-200 font-medium">{selectedOrder.items_resumen}</p>
              {selectedOrder.notas && (
                <p className="text-amber-400 italic pt-1 border-t border-white/5">
                  Notas de cocina: {selectedOrder.notas}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="p-3.5 rounded-xl bg-dark-950 border border-white/5 text-xs space-y-1.5 mb-5">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {Number(selectedOrder.costo_envio) > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Envío a domicilio:</span>
                  <span className="font-mono text-amber-400">+{formatCurrency(selectedOrder.costo_envio)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Método de pago:</span>
                <span>{selectedOrder.metodo_pago}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-white/10 font-bold text-white text-sm">
                <span>TOTAL:</span>
                <span className="text-amber-400 font-display text-lg">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* Fast status switcher inside modal */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">
                Cambiar Estado Manualmente:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {['Pendiente', 'En Cocina', 'En Camino', 'Entregado'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedOrder.estado === st
                        ? 'bg-amber-400 text-black shadow-glow-amber'
                        : 'bg-dark-900 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
