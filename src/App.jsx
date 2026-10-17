import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import POSPage from './pages/POSPage';
import OrdersMonitorPage from './pages/OrdersMonitorPage';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import ReportsPage from './pages/ReportsPage';
import { insforge, TABLES } from './lib/insforge';

export default function App() {
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending orders count for sidebar badge
  const fetchPendingCount = async () => {
    try {
      const { data, error } = await insforge.database
        .from(TABLES.PEDIDOS)
        .select('id')
        .eq('estado', 'Pendiente');
      if (!error && data) {
        setPendingCount(data.length);
      }
    } catch (e) {
      // Ignore background badge error
    }
  };

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-brand-500 selection:text-black">
        {/* Persistent Lateral Sidebar */}
        <Sidebar pendingCount={pendingCount} />

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-72 min-h-screen flex flex-col overflow-y-auto pb-20 lg:pb-6">
          <Routes>
            <Route path="/" element={<Navigate to="/pos" replace />} />
            <Route
              path="/pos"
              element={<POSPage onOrderCreated={fetchPendingCount} />}
            />
            <Route path="/pedidos" element={<OrdersMonitorPage />} />
            <Route path="/clientes" element={<CustomersPage />} />
            <Route path="/productos" element={<ProductsPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
