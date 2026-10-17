import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Kanban,
  Users,
  UtensilsCrossed,
  BarChart3,
  Flame,
  Menu,
  X,
  Clock,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ pendingCount = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      to: '/pos',
      label: 'Punto de Venta',
      shortLabel: 'POS',
      icon: ShoppingBag,
      badge: null,
      desc: 'Toma rápida de pedidos'
    },
    {
      to: '/pedidos',
      label: 'Monitor de Pedidos',
      shortLabel: 'Pedidos',
      icon: Kanban,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-amber-400 text-black',
      desc: 'Flujo Kanban de cocina'
    },
    {
      to: '/clientes',
      label: 'Clientes (CRM)',
      shortLabel: 'Clientes',
      icon: Users,
      badge: null,
      desc: 'Historial y fidelización'
    },
    {
      to: '/productos',
      label: 'Productos',
      shortLabel: 'Menú',
      icon: UtensilsCrossed,
      badge: null,
      desc: 'Menú e inventario'
    },
    {
      to: '/reportes',
      label: 'Reportes',
      shortLabel: 'Reportes',
      icon: BarChart3,
      badge: null,
      desc: 'Cierre de caja y métricas'
    }
  ];

  return (
    <>
      {/* 1. Mobile Top Header Bar */}
      <div className="lg:hidden flex items-center justify-between px-3.5 py-2.5 bg-dark-900/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-flame-600 flex items-center justify-center shadow-glow-amber">
            <Flame className="w-5 h-5 text-black fill-black" />
          </div>
          <div>
            <h1 className="font-display font-black text-sm text-white leading-tight tracking-tight flex items-center gap-1.5">
              ANTIGRAVITY <span className="text-amber-400 text-[10px] px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/30">FAST FOOD</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-amber-400/90 font-semibold bg-dark-800 px-2 py-1 rounded-lg border border-white/5">
            {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg bg-dark-800 text-slate-300 hover:text-white border border-white/10 active:scale-95 transition-all"
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 2. Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 3. Persistent Sidebar (Desktop) / Slide-over Drawer (Mobile) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-dark-900/95 backdrop-blur-2xl border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-flame-600 flex items-center justify-center shadow-glow-orange">
                <Flame className="w-6 h-6 text-black fill-black" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-900 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-lg text-white tracking-tight">ANTIGRAVITY</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                  FAST FOOD
                </span>
                <span className="text-[10px] text-slate-400">v2.4</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navegación Principal
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex items-center justify-between px-3.5 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-400 border border-amber-500/30 shadow-glow-amber'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-amber-400 text-black shadow-md'
                            : 'bg-dark-800 text-slate-400 group-hover:text-amber-400 group-hover:bg-dark-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold tracking-wide">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal leading-none mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    {item.badge !== null && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                          item.badgeColor || 'bg-amber-400 text-black'
                        } animate-bounce`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <div className="absolute right-0 top-2 bottom-2 w-1 bg-amber-400 rounded-l" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / System Status */}
        <div className="p-4 border-t border-white/10 bg-dark-950/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Turno Activo</span>
            </div>
            <span className="font-mono text-slate-300 font-semibold">
              {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-dark-800/80 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-[11px] font-semibold text-slate-200 leading-none">Insforge BaaS</p>
                <p className="text-[10px] text-slate-400 leading-none mt-1">Conexión Segura</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
              Activo
            </span>
          </div>
        </div>
      </aside>

      {/* 4. Mobile Bottom Persistent Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-900/95 backdrop-blur-xl border-t border-white/10 px-1 py-1.5 flex justify-around items-center shadow-2xl safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-amber-400' : ''}`} />
                    {item.badge !== null && (
                      <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 text-[9px] font-black rounded-full bg-amber-400 text-black shadow">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.shortLabel}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5 shadow-glow-amber" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </>
  );
}
