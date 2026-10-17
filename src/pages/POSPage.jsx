import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  CreditCard,
  Banknote,
  Send,
  X,
  UserPlus,
  RefreshCw,
  Utensils
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { insforge, TABLES, CATEGORIES, PAYMENT_METHODS, formatCurrency } from '../lib/insforge';

export default function POSPage({ onOrderCreated }) {
  // Products state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchProduct, setSearchProduct] = useState('');

  // Cart state
  const [cart, setCart] = useState([]);
  const [deliveryType, setDeliveryType] = useState('LOCAL'); // 'LOCAL' | 'DOMICILIO'
  const [shippingFee, setShippingFee] = useState(5000);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [orderNotes, setOrderNotes] = useState('');

  // Customer search & selection
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [customerSearched, setCustomerSearched] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [matchingCustomers, setMatchingCustomers] = useState([]);

  // New customer form state
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerApodo, setNewCustomerApodo] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerNotes, setNewCustomerNotes] = useState('');
  const [registeringCustomer, setRegisteringCustomer] = useState(false);

  // Mobile view tab state ('catalog' | 'cart')
  const [mobileTab, setMobileTab] = useState('catalog');

  // Total items in cart
  const totalCartItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Order processing state
  const [processingOrder, setProcessingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data, error } = await insforge.database
        .from(TABLES.PRODUCTOS)
        .select('*')
        .order('nombre', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Search customer by name, apodo, or WhatsApp
  const handleSearchCustomer = async (termToSearch) => {
    const cleaned = (termToSearch || phoneSearch).trim();
    if (!cleaned) return;
    try {
      setSearchingCustomer(true);
      setCustomerSearched(true);
      setMatchingCustomers([]);

      const isDigitsOnly = /^\d+$/.test(cleaned);
      let query = insforge.database.from(TABLES.CLIENTES).select('*');

      if (isDigitsOnly) {
        query = query.or(`telefono.ilike.%${cleaned}%`);
      } else {
        query = query.or(`nombre.ilike.%${cleaned}%,apodo.ilike.%${cleaned}%,telefono.ilike.%${cleaned}%`);
      }

      const { data, error } = await query.limit(8);

      if (error) throw error;

      if (data && data.length === 1) {
        setCustomer(data[0]);
        setMatchingCustomers([]);
      } else if (data && data.length > 1) {
        setMatchingCustomers(data);
        setCustomer(null);
      } else {
        setCustomer(null);
        setMatchingCustomers([]);
        if (isDigitsOnly) {
          setNewCustomerPhone(cleaned);
        } else {
          setNewCustomerName(cleaned);
        }
      }
    } catch (err) {
      console.error('Error searching customer:', err);
    } finally {
      setSearchingCustomer(false);
    }
  };

  // Register new customer
  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return;

    try {
      setRegisteringCustomer(true);
      const { data, error } = await insforge.database
        .from(TABLES.CLIENTES)
        .insert([
          {
            nombre: newCustomerName.trim(),
            apodo: newCustomerApodo.trim() || null,
            telefono: newCustomerPhone.trim(),
            direccion: newCustomerAddress.trim() || null,
            notas: newCustomerNotes.trim() || null,
            total_gastado: 0,
            total_pedidos: 0,
            pedidos_domicilio: 0,
            pedidos_local: 0
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setCustomer(data);
      setShowRegisterModal(false);
      setPhoneSearch(data.telefono);
      setNewCustomerName('');
      setNewCustomerApodo('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      setNewCustomerNotes('');
    } catch (err) {
      alert('Error registrando cliente: ' + (err.message || 'Verifica los datos del cliente.'));
    } finally {
      setRegisteringCustomer(false);
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    if (!product.disponible) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
  };

  // Remove / decrement from cart
  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateItemNotes = (productId, notes) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, notes } : item
      )
    );
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.precio * item.quantity, 0);
  }, [cart]);

  const deliveryCost = deliveryType === 'DOMICILIO' ? Number(shippingFee) || 0 : 0;
  const grandTotal = subtotal + deliveryCost;

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory =
        selectedCategory === 'Todos' || prod.categoria === selectedCategory;
      const matchesSearch =
        prod.nombre.toLowerCase().includes(searchProduct.toLowerCase()) ||
        (prod.descripcion && prod.descripcion.toLowerCase().includes(searchProduct.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchProduct]);

  // Process checkout
  const handleProcessOrder = async () => {
    if (cart.length === 0) {
      alert('Agrega al menos un producto al pedido.');
      return;
    }

    if (!customer) {
      alert('Por favor busca o registra un cliente por su nombre, apodo o WhatsApp.');
      return;
    }

    if (deliveryType === 'DOMICILIO' && !customer.direccion && !newCustomerAddress) {
      alert('Para pedidos a domicilio, el cliente debe tener una dirección registrada.');
      return;
    }

    try {
      setProcessingOrder(true);

      const orderCode = `#DEL-${Math.floor(1000 + Math.random() * 9000)}`;
      const itemsSummary = cart
        .map((i) => `${i.quantity}x ${i.product.nombre}`)
        .join(', ');

      // 1. Insert order into deleites_pedidos
      const { data: orderData, error: orderError } = await insforge.database
        .from(TABLES.PEDIDOS)
        .insert([
          {
            codigo_pedido: orderCode,
            cliente_id: customer.id,
            cliente_nombre: customer.nombre,
            cliente_telefono: customer.telefono,
            tipo_entrega: deliveryType,
            direccion_entrega: deliveryType === 'DOMICILIO' ? customer.direccion : null,
            costo_envio: deliveryCost,
            subtotal: subtotal,
            total: grandTotal,
            metodo_pago: paymentMethod,
            estado: 'Pendiente',
            notas: orderNotes.trim() || null,
            items_resumen: itemsSummary
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert items into deleites_pedido_items
      const itemsPayload = cart.map((item) => ({
        pedido_id: orderData.id,
        producto_id: item.product.id,
        producto_nombre: item.product.nombre,
        categoria: item.product.categoria,
        precio_unitario: item.product.precio,
        cantidad: item.quantity,
        subtotal: item.product.precio * item.quantity,
        notas: item.notes.trim() || null
      }));

      const { error: itemsError } = await insforge.database
        .from(TABLES.PEDIDO_ITEMS)
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      // 3. Update customer stats in deleites_clientes (LTV, order count, delivery/local breakdown)
      const newTotalSpent = (Number(customer.total_gastado) || 0) + grandTotal;
      const newTotalOrders = (Number(customer.total_pedidos) || 0) + 1;
      const isDom = deliveryType === 'DOMICILIO';
      const newDomCount = (Number(customer.pedidos_domicilio) || 0) + (isDom ? 1 : 0);
      const newLocalCount = (Number(customer.pedidos_local) || 0) + (isDom ? 0 : 1);

      await insforge.database
        .from(TABLES.CLIENTES)
        .update({
          total_gastado: newTotalSpent,
          total_pedidos: newTotalOrders,
          pedidos_domicilio: newDomCount,
          pedidos_local: newLocalCount,
          ultima_compra_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      // Celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setCompletedOrder({
        ...orderData,
        items: cart,
        customer
      });
      setShowSuccessModal(true);

      // Notify parent to update pending count if needed
      if (onOrderCreated) onOrderCreated();

      // Reset cart and customer state for next order
      setCart([]);
      setOrderNotes('');
      setCustomer(null);
      setPhoneSearch('');
      setCustomerSearched(false);
    } catch (err) {
      console.error('Error processing order:', err);
      alert('Error procesando el pedido: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-black text-white tracking-tight flex items-center gap-2">
            <span>PUNTO DE VENTA (POS)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans font-bold">
              TOMA RÁPIDA
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestiona la orden, asocia al cliente y envía a cocina en segundos.
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 text-slate-300 hover:text-white border border-white/10 hover:border-amber-500/30 text-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Actualizar Catálogo</span>
        </button>
      </div>

      {/* Mobile Tab Switcher (Visible only on < lg screens) */}
      <div className="lg:hidden grid grid-cols-2 gap-2 bg-dark-900 p-1.5 rounded-xl border border-white/10 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'catalog'
              ? 'bg-amber-400 text-black shadow-glow-amber'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>1. Menú & Cliente</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all relative ${
            mobileTab === 'cart'
              ? 'bg-amber-400 text-black shadow-glow-amber'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>2. Carrito ({totalCartItems})</span>
          {cart.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping absolute top-1 right-2" />
          )}
        </button>
      </div>

      {/* Main Grid: Left Products / Right Cart Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Customer Bar + Products Grid (7 cols) */}
        <div
          className={`${
            mobileTab === 'catalog' ? 'block' : 'hidden lg:block'
          } lg:col-span-7 xl:col-span-8 space-y-5`}
        >
          {/* 1. SECCIÓN DE CLIENTE */}
          <div className="glass-panel rounded-2xl p-4 lg:p-5 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Identificación del Cliente
                </h2>
              </div>
              {customer && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cliente Verificado
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apodo o WhatsApp..."
                  value={phoneSearch}
                  onChange={(e) => {
                    setPhoneSearch(e.target.value);
                    if (!e.target.value) {
                      setCustomer(null);
                      setCustomerSearched(false);
                      setMatchingCustomers([]);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchCustomer(phoneSearch);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSearchCustomer(phoneSearch)}
                disabled={searchingCustomer || !phoneSearch.trim()}
                className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 border border-white/10 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {searchingCustomer ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Search className="w-4 h-4 text-amber-400" />
                )}
                <span>Buscar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewCustomerPhone(/^\d+$/.test(phoneSearch) ? phoneSearch : '');
                  setNewCustomerName(!/^\d+$/.test(phoneSearch) ? phoneSearch : '');
                  setShowRegisterModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Registrar</span>
              </button>
            </div>

            {/* Multiple Matches Picker */}
            {matchingCustomers.length > 1 && !customer && (
              <div className="mt-3 p-3 bg-dark-900/90 border border-amber-500/30 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Se encontraron {matchingCustomers.length} clientes. Selecciona uno:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {matchingCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCustomer(c);
                        setMatchingCustomers([]);
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-white/5 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{c.nombre}</span>
                        {c.apodo && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-semibold">
                            "{c.apodo}"
                          </span>
                        )}
                        <span className="text-slate-400 font-mono text-[11px] ml-1">
                          WA: {c.telefono}
                        </span>
                      </div>
                      <span className="text-emerald-400 font-mono font-semibold">
                        {formatCurrency(c.total_gastado || 0)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Details Display or Unregistered Alert */}
            {customer ? (
              <div className="mt-4 p-3.5 rounded-xl bg-dark-900/90 border border-amber-500/20 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-base">{customer.nombre}</span>
                      {customer.apodo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">
                          "{customer.apodo}"
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">
                        (WhatsApp: {customer.telefono})
                      </span>
                    </div>
                    {customer.direccion ? (
                      <div className="text-xs text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{customer.direccion}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-400/80 italic">
                        Sin dirección guardada (requerida solo para domicilio)
                      </div>
                    )}
                  </div>

                  {(() => {
                    const totalOrders = Number(customer.total_pedidos) || 0;
                    const totalSpent = Number(customer.total_gastado) || 0;
                    const avgTicket = totalOrders > 0 ? totalSpent / totalOrders : 0;
                    const domCount = Number(customer.pedidos_domicilio) || 0;
                    const localCount = Number(customer.pedidos_local) || 0;
                    const preferenceBadge =
                      domCount > localCount
                        ? { label: '🛵 Suele pedir Domicilio', cls: 'text-amber-300 bg-amber-400/10 border-amber-400/20' }
                        : localCount > domCount
                        ? { label: '🍽️ Suele ir al Local', cls: 'text-blue-300 bg-blue-400/10 border-blue-400/20' }
                        : totalOrders > 0
                        ? { label: '⚖️ Canal Mixto', cls: 'text-purple-300 bg-purple-400/10 border-purple-400/20' }
                        : { label: '✨ Cliente Nuevo', cls: 'text-slate-400 bg-slate-800 border-white/5' };

                    return (
                      <div className="flex items-center gap-2.5 flex-wrap text-xs">
                        <div className="bg-dark-800 px-2.5 py-1.5 rounded-lg border border-white/5">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Pedidos</span>
                          <span className="font-bold text-amber-400">{totalOrders}</span>
                        </div>
                        <div className="bg-dark-800 px-2.5 py-1.5 rounded-lg border border-white/5">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Gastado</span>
                          <span className="font-bold text-emerald-400">{formatCurrency(totalSpent)}</span>
                        </div>
                        <div className="bg-dark-800 px-2.5 py-1.5 rounded-lg border border-white/5">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Ticket Prom.</span>
                          <span className="font-bold text-orange-400">{formatCurrency(avgTicket)}</span>
                        </div>
                        <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${preferenceBadge.cls}`}>
                          {preferenceBadge.label}
                        </div>
                        <button
                          onClick={() => {
                            setCustomer(null);
                            setPhoneSearch('');
                            setCustomerSearched(false);
                            setMatchingCustomers([]);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Desvincular cliente"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {customer.notas && (
                  <div className="text-xs text-amber-300/90 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">
                      Notas del Cliente
                    </span>
                    <span className="italic">{customer.notas}</span>
                  </div>
                )}
              </div>
            ) : customerSearched && !searchingCustomer && matchingCustomers.length === 0 ? (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No se encontró ningún cliente con <strong>"{phoneSearch}"</strong>.</span>
                </div>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-2.5 py-1 rounded bg-amber-400 text-black font-bold hover:bg-amber-300 text-xs transition-colors shrink-0"
                >
                  Registrar Ahora
                </button>
              </div>
            ) : null}
          </div>

          {/* 2. SECCIÓN DE PRODUCTOS */}
          <div className="space-y-4">
            {/* Search + Category Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {['Todos', ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-black shadow-glow-amber'
                        : 'bg-dark-900 text-slate-300 hover:bg-dark-800 border border-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Search Input */}
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar producto..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-dark-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Products Visual Grid */}
            {loadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 py-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-dark-900/60 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-dark-900/40 border border-white/5">
                <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No se encontraron productos en esta categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((i) => i.product.id === product.id);
                  const inCartQty = cartItem ? cartItem.quantity : 0;
                  const isAvailable = product.disponible;

                  return (
                    <div
                      key={product.id}
                      className={`group relative rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 border ${
                        !isAvailable
                          ? 'opacity-50 grayscale bg-dark-900/40 border-white/5 cursor-not-allowed'
                          : inCartQty > 0
                          ? 'bg-dark-850 border-amber-500/50 shadow-glow-amber ring-1 ring-amber-500/40'
                          : 'bg-dark-900 hover:bg-dark-850 border-white/10 hover:border-amber-500/30'
                      }`}
                    >
                      {/* Product Image */}
                      <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-dark-950">
                        {product.imagen_url ? (
                          <img
                            src={product.imagen_url}
                            alt={product.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-dark-800 text-slate-600">
                            <Utensils className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-80" />

                        {/* Availability Pill */}
                        {!isAvailable ? (
                          <span className="absolute top-2 right-2 text-[10px] font-bold bg-rose-500/90 text-white px-2 py-0.5 rounded-full shadow">
                            AGOTADO
                          </span>
                        ) : inCartQty > 0 ? (
                          <span className="absolute top-2 right-2 text-xs font-black bg-amber-400 text-black px-2 py-0.5 rounded-full shadow-lg">
                            {inCartQty} en carrito
                          </span>
                        ) : null}

                        {/* Category tag */}
                        <span className="absolute bottom-2 left-2 text-[10px] font-medium text-slate-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                          {product.categoria}
                        </span>
                      </div>

                      {/* Info & Action */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-1 leading-snug">
                            {product.nombre}
                          </h3>
                          {product.descripcion && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-tight">
                              {product.descripcion}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                          <span className="font-display font-black text-amber-400 text-sm sm:text-base">
                            {formatCurrency(product.precio)}
                          </span>

                          {isAvailable && (
                            <div className="flex items-center gap-1">
                              {inCartQty > 0 ? (
                                <div className="flex items-center gap-1 bg-dark-800 p-0.5 rounded-lg border border-amber-500/30">
                                  <button
                                    onClick={() => updateQuantity(product.id, -1)}
                                    className="p-1 rounded-md text-amber-400 hover:bg-amber-400 hover:text-black transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-bold px-1 text-white">{inCartQty}</span>
                                  <button
                                    onClick={() => addToCart(product)}
                                    className="p-1 rounded-md text-amber-400 hover:bg-amber-400 hover:text-black transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(product)}
                                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 transition-all shadow-md active:scale-95"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Agregar</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart & Checkout (5 cols) */}
        <div
          className={`${
            mobileTab === 'cart' ? 'block' : 'hidden lg:block'
          } lg:col-span-5 xl:col-span-4 sticky top-6 space-y-4`}
        >
          <div className="glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            {/* Cart Header */}
            <div className="p-4 bg-dark-900/90 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h2 className="font-display font-black text-white text-lg tracking-tight">
                  ORDEN ACTUAL
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vaciar
                </button>
              )}
            </div>

            {/* Delivery Type Toggle */}
            <div className="p-3 bg-dark-950/70 border-b border-white/5">
              <div className="grid grid-cols-2 gap-2 bg-dark-900 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setDeliveryType('LOCAL')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    deliveryType === 'LOCAL'
                      ? 'bg-amber-400 text-black shadow-glow-amber'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🍽️ En Local</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('DOMICILIO')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    deliveryType === 'DOMICILIO'
                      ? 'bg-amber-400 text-black shadow-glow-amber'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🛵 Domicilio</span>
                </button>
              </div>

              {/* Delivery Extra Details */}
              {deliveryType === 'DOMICILIO' && (
                <div className="mt-3 p-3 rounded-xl bg-dark-850 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Costo de Envío:</span>
                    <div className="flex items-center gap-1 w-28">
                      <span className="text-amber-400 font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                        className="w-full bg-dark-950 border border-white/10 rounded px-2 py-0.5 text-right text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                  {customer && (
                    <div className="text-[11px] text-slate-400 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {customer.direccion || '⚠️ Cliente sin dirección configurada'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="p-4 max-h-[320px] overflow-y-auto space-y-3 divide-y divide-white/5">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-500">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">El carrito está vacío</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Selecciona productos del menú para comenzar
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pt-2 first:pt-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {item.product.nombre}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatCurrency(item.product.precio)} c/u
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-400 font-mono">
                          {formatCurrency(item.product.precio * item.quantity)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Nota: Sin cebolla, salsas..."
                        value={item.notes}
                        onChange={(e) => updateItemNotes(item.product.id, e.target.value)}
                        className="flex-1 bg-dark-900 border border-white/5 rounded-lg px-2 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />

                      <div className="flex items-center gap-1.5 bg-dark-900 px-1 py-0.5 rounded-lg border border-white/10 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 rounded text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold px-1 text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 rounded text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Eliminar ítem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="p-4 bg-dark-900/60 border-t border-white/10 space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left truncate transition-all ${
                        paymentMethod === pm
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : 'bg-dark-950 text-slate-400 hover:bg-dark-800 border border-white/5'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* General Order Notes */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Observaciones Generales
                </label>
                <input
                  type="text"
                  placeholder="Ej: Mesa #3 / Entregar con cubiertos..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                {deliveryType === 'DOMICILIO' && (
                  <div className="flex justify-between text-slate-400">
                    <span>Domicilio:</span>
                    <span className="font-mono text-amber-400">+{formatCurrency(deliveryCost)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-white/10 text-white font-bold">
                  <span className="text-sm font-display">TOTAL A COBRAR:</span>
                  <span className="text-xl font-display font-black text-amber-400">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Big Glow Button: PROCESAR PAGO */}
              <button
                type="button"
                onClick={handleProcessOrder}
                disabled={processingOrder || cart.length === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-flame-600 text-black font-display font-extrabold text-base tracking-wide shadow-glow-orange hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {processingOrder ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>ENVIANDO A INSFORGE...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-black" />
                    <span>PROCESAR PAGO ({formatCurrency(grandTotal)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Cart Bar for Mobile (when browsing catalog) */}
      {mobileTab === 'catalog' && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30">
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-flame-600 text-black font-display font-extrabold text-sm shadow-glow-orange flex items-center justify-between active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-amber-400 flex items-center justify-center text-xs font-black">
                {totalCartItems}
              </span>
              <span>Ver Pedido ({cart.length} productos)</span>
            </div>
            <div className="flex items-center gap-1.5 font-black text-base">
              <span>{formatCurrency(grandTotal)}</span>
              <span className="text-lg">→</span>
            </div>
          </button>
        </div>
      )}

      {/* MODAL: Register New Customer */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl border border-white/10 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-lg">Registrar Nuevo Cliente</h3>
                <p className="text-xs text-slate-400">Se guardará de inmediato en Insforge</p>
              </div>
            </div>

            <form onSubmit={handleRegisterCustomer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juliana Restrepo"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Apodo / Alias (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juli, Don Pedro, Vecina..."
                  value={newCustomerApodo}
                  onChange={(e) => setNewCustomerApodo(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Número de WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 3158889900"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Dirección de Entrega
                </label>
                <input
                  type="text"
                  placeholder="Ej: Calle 45 # 12-34 Torre 2 Apto 301"
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notas de Preferencias o Fidelización (Opcional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Ej: Sin cebolla, salsas aparte, timbre 201..."
                  value={newCustomerNotes}
                  onChange={(e) => setNewCustomerNotes(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={registeringCustomer}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-glow-amber transition-colors flex items-center gap-1.5"
                >
                  {registeringCustomer ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Guardar Cliente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Success Ticket / Receipt */}
      {showSuccessModal && completedOrder && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-sm w-full rounded-3xl border border-amber-500/30 shadow-2xl p-6 relative text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-amber-400 flex items-center justify-center mx-auto mb-3 shadow-glow-amber">
              <CheckCircle2 className="w-10 h-10 text-black" />
            </div>

            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              ¡Pedido Enviado a Cocina!
            </span>
            <h3 className="font-display font-black text-2xl text-white mt-1">
              {completedOrder.codigo_pedido}
            </h3>

            <div className="my-4 p-4 rounded-2xl bg-dark-900/90 border border-white/10 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-white">{completedOrder.cliente_nombre}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Tipo:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  completedOrder.tipo_entrega === 'DOMICILIO'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {completedOrder.tipo_entrega}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Pago:</span>
                <span>{completedOrder.metodo_pago}</span>
              </div>
              <div className="pt-2 border-t border-white/5 space-y-1">
                {completedOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-300">
                    <span>{it.quantity}x {it.product.nombre}</span>
                    <span className="font-mono">{formatCurrency(it.product.precio * it.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-sm text-white">
                <span>TOTAL:</span>
                <span className="text-amber-400 font-display">{formatCurrency(completedOrder.total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setCompletedOrder(null);
                }}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold shadow-glow-amber transition-colors"
              >
                Tomar Siguiente Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
