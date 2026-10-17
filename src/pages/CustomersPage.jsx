import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  ExternalLink,
  Edit2,
  RefreshCw,
  X,
  Award,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { insforge, TABLES, formatCurrency, formatDateTime, timeAgo } from '../lib/insforge';

export default function CustomersPage({ onSelectCustomerForPOS }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge.database
        .from(TABLES.CLIENTES)
        .select('*')
        .order('total_gastado', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Open modal for Create or Edit
  const openModal = (cust = null) => {
    if (cust) {
      setEditingCustomer(cust);
      setFormName(cust.nombre);
      setFormPhone(cust.telefono);
      setFormAddress(cust.direccion || '');
      setFormNotes(cust.notas || '');
    } else {
      setEditingCustomer(null);
      setFormName('');
      setFormPhone('');
      setFormAddress('');
      setFormNotes('');
    }
    setModalOpen(true);
  };

  // Save customer (Insert or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    try {
      setSaving(true);
      if (editingCustomer) {
        // Update
        const { error } = await insforge.database
          .from(TABLES.CLIENTES)
          .update({
            nombre: formName.trim(),
            telefono: formPhone.trim(),
            direccion: formAddress.trim() || null,
            notas: formNotes.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCustomer.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await insforge.database
          .from(TABLES.CLIENTES)
          .insert([
            {
              nombre: formName.trim(),
              telefono: formPhone.trim(),
              direccion: formAddress.trim() || null,
              notas: formNotes.trim() || null,
              total_gastado: 0,
              total_pedidos: 0
            }
          ]);

        if (error) throw error;
      }

      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      alert('Error guardando cliente: ' + (err.message || 'Verifica los datos'));
    } finally {
      setSaving(false);
    }
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchTerm.toLowerCase();
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        (c.direccion && c.direccion.toLowerCase().includes(q))
      );
    });
  }, [customers, searchTerm]);

  // CRM Analytics KPIs
  const totalClients = customers.length;
  const totalRevenue = customers.reduce((acc, c) => acc + (Number(c.total_gastado) || 0), 0);
  const avgLtv = totalClients > 0 ? totalRevenue / totalClients : 0;
  const topCustomer = customers[0] || null;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-black text-white tracking-tight flex items-center gap-2">
            <span>CLIENTES & CRM</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans font-bold">
              FIDELIZACIÓN
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Conoce el historial de compra, gasto total (LTV) y datos de contacto de tus clientes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCustomers}
            className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 border border-white/10"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openModal()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-black font-display font-bold text-xs shadow-glow-amber flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 fill-black" />
            <span>+ Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* CRM KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Clientes</span>
            <p className="text-2xl font-display font-black text-white">{totalClients}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Gasto Total Acumulado</span>
            <p className="text-xl font-display font-black text-emerald-400">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">LTV Promedio</span>
            <p className="text-xl font-display font-black text-blue-400">{formatCurrency(avgLtv)}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Cliente VIP</span>
            <p className="text-sm font-bold text-white truncate max-w-[140px]">
              {topCustomer ? topCustomer.nombre : 'N/A'}
            </p>
            {topCustomer && (
              <span className="text-[11px] text-purple-400 font-mono">
                {formatCurrency(topCustomer.total_gastado)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        {/* Search & Action Bar */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <span className="text-xs text-slate-400 self-end sm:self-auto font-mono">
            Mostrando {filteredCustomers.length} de {customers.length} clientes
          </span>
        </div>

        {/* Mobile Cards View (Visible on screens < lg) */}
        <div className="lg:hidden p-3 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
              Cargando clientes...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No se encontraron clientes.
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const cleanPhone = cust.telefono.replace(/\D/g, '');
              const waNumber = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;

              return (
                <div
                  key={cust.id}
                  className="p-3.5 rounded-xl bg-dark-900 border border-white/5 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs font-display shrink-0">
                        {cust.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm leading-tight">{cust.nombre}</h4>
                        {cust.notas && (
                          <p className="text-[10px] text-slate-400 italic line-clamp-1">{cust.notas}</p>
                        )}
                      </div>
                    </div>

                    <span className="font-display font-extrabold text-emerald-400 text-sm shrink-0">
                      {formatCurrency(cust.total_gastado || 0)}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300 pt-1 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Teléfono:</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span>{cust.telefono}</span>
                        <a
                          href={`https://wa.me/${waNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {cust.direccion && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-400 text-[11px] shrink-0">Dirección:</span>
                        <span className="text-right truncate max-w-[200px] text-slate-200">
                          {cust.direccion}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Última compra:</span>
                      <span className="text-amber-400 text-[11px] font-semibold">
                        {timeAgo(cust.ultima_compra_at)} ({cust.total_pedidos || 0} pedidos)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                    <button
                      onClick={() => openModal(cust)}
                      className="px-3 py-1.5 rounded-lg bg-dark-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onSelectCustomerForPOS) onSelectCustomerForPOS(cust);
                        navigate('/pos');
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Tomar Pedido</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table (Hidden on small screens) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-white/5">
              <tr>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Teléfono / WhatsApp</th>
                <th className="px-5 py-3.5">Dirección de Entrega</th>
                <th className="px-5 py-3.5">Última Compra</th>
                <th className="px-5 py-3.5 text-right">Pedidos</th>
                <th className="px-5 py-3.5 text-right">LTV (Gasto Total)</th>
                <th className="px-5 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    Cargando base de clientes desde Insforge...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    No se encontraron clientes con el criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, idx) => {
                  const cleanPhone = cust.telefono.replace(/\D/g, '');
                  const waNumber = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs font-display">
                            {cust.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {cust.nombre}
                            </span>
                            {cust.notas && (
                              <span className="text-[10px] text-slate-500 italic line-clamp-1">
                                {cust.notas}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone & WhatsApp */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-200">{cust.telefono}</span>
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                            title="Abrir chat en WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="px-5 py-4">
                        {cust.direccion ? (
                          <div className="flex items-center gap-1.5 text-slate-300 max-w-xs">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{cust.direccion}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">No registrada</span>
                        )}
                      </td>

                      {/* Last Purchase */}
                      <td className="px-5 py-4">
                        {cust.ultima_compra_at ? (
                          <div>
                            <span className="text-amber-400 font-semibold block">
                              {timeAgo(cust.ultima_compra_at)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatDateTime(cust.ultima_compra_at)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Sin compras aún</span>
                        )}
                      </td>

                      {/* Total Orders */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-bold text-slate-200 bg-dark-900 px-2 py-0.5 rounded border border-white/5">
                          {cust.total_pedidos || 0}
                        </span>
                      </td>

                      {/* LTV */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-display font-extrabold text-emerald-400 text-sm">
                          {formatCurrency(cust.total_gastado || 0)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openModal(cust)}
                            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-white/5 transition-colors"
                            title="Editar cliente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (onSelectCustomerForPOS) onSelectCustomerForPOS(cust);
                              navigate('/pos');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-[11px] shadow transition-colors flex items-center gap-1"
                            title="Tomar pedido para este cliente en POS"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Crear Pedido</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create / Edit Customer */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl border border-white/10 shadow-2xl p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                {editingCustomer ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-lg">
                  {editingCustomer ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
                </h3>
                <p className="text-xs text-slate-400">Sincronización instantánea con Insforge</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Andrés Gómez"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Teléfono / Celular *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 3201122334"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Dirección Habitual
                </label>
                <input
                  type="text"
                  placeholder="Ej: Carrera 15 # 85-30"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notas de Preferencias o Fidelización
                </label>
                <textarea
                  rows="2"
                  placeholder="Ej: Prefiere hamburguesas sin cebolla, timbre 402..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-glow-amber transition-colors flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
