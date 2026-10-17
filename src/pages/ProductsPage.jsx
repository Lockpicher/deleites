import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  X,
  Image as ImageIcon,
  DollarSign,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { insforge, TABLES, CATEGORIES, formatCurrency } from '../lib/insforge';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge.database
        .from(TABLES.PRODUCTOS)
        .select('*')
        .order('categoria', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Quick toggle "Disponible / Agotado" in Insforge
  const handleToggleAvailable = async (product) => {
    const updatedStatus = !product.disponible;
    try {
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, disponible: updatedStatus } : p))
      );

      const { error } = await insforge.database
        .from(TABLES.PRODUCTOS)
        .update({
          disponible: updatedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling availability:', err);
      alert('Error actualizando disponibilidad en Insforge: ' + err.message);
      fetchProducts(); // revert on failure
    }
  };

  // Open modal for Create or Edit
  const openModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormName(prod.nombre);
      setFormCategory(prod.categoria);
      setFormPrice(prod.precio.toString());
      setFormDescription(prod.descripcion || '');
      setFormImageUrl(prod.imagen_url || '');
      setFormAvailable(prod.disponible);
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormCategory(CATEGORIES[0]);
      setFormPrice('');
      setFormDescription('');
      setFormImageUrl('');
      setFormAvailable(true);
    }
    setModalOpen(true);
  };

  // Save product (Insert or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) return;

    try {
      setSaving(true);
      const payload = {
        nombre: formName.trim(),
        categoria: formCategory,
        precio: parseFloat(formPrice),
        descripcion: formDescription.trim() || null,
        imagen_url: formImageUrl.trim() || null,
        disponible: formAvailable,
        updated_at: new Date().toISOString()
      };

      if (editingProduct) {
        const { error } = await insforge.database
          .from(TABLES.PRODUCTOS)
          .update(payload)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await insforge.database
          .from(TABLES.PRODUCTOS)
          .insert([payload]);

        if (error) throw error;
      }

      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert('Error guardando producto: ' + (err.message || 'Verifica los campos'));
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      setDeleting(true);
      const { error } = await insforge.database
        .from(TABLES.PRODUCTOS)
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      setDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      alert('Error eliminando producto: ' + (err.message || 'Error en Insforge'));
    } finally {
      setDeleting(false);
    }
  };

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'Todos' || p.categoria === selectedCategory;
      const matchSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-black text-white tracking-tight flex items-center gap-2">
            <span>GESTIÓN DE PRODUCTOS</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans font-bold">
              MENÚ & INVENTARIO
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Administra precios, descripciones y disponibilidad de tu catálogo en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 border border-white/10"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openModal()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-black font-display font-bold text-xs shadow-glow-amber flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
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

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar producto por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-dark-900/60 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-2xl border border-white/5">
          <UtensilsCrossed className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold text-sm">No hay productos en esta selección.</p>
          <button
            onClick={() => openModal()}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold"
          >
            Crear Primer Producto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            return (
              <div
                key={product.id}
                className={`group glass-panel rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col justify-between ${
                  product.disponible
                    ? 'border-white/10 hover:border-amber-500/40'
                    : 'border-rose-500/20 bg-dark-950/40 opacity-70'
                }`}
              >
                {/* Image & Badges */}
                <div className="relative h-40 w-full overflow-hidden bg-dark-950">
                  {product.imagen_url ? (
                    <img
                      src={product.imagen_url}
                      alt={product.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-dark-900">
                      <UtensilsCrossed className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-80" />

                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-md">
                    {product.categoria}
                  </span>

                  {/* Toggle Switch Top-Right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                    <span className={`text-[10px] font-bold ${product.disponible ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {product.disponible ? 'DISPONIBLE' : 'AGOTADO'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleAvailable(product)}
                      className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                        product.disponible ? 'bg-emerald-500' : 'bg-rose-600'
                      }`}
                      title="Cambiar disponibilidad"
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          product.disponible ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-white text-base line-clamp-1">
                      {product.nombre}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {product.descripcion || 'Sin descripción'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">PRECIO ACTUAL</span>
                      <span className="font-display font-black text-amber-400 text-lg">
                        {formatCurrency(product.precio)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openModal(product)}
                        className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-white/5 transition-colors"
                        title="Editar producto"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setProductToDelete(product);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Create / Edit Product */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-2xl border border-white/10 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-lg">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <p className="text-xs text-slate-400">Actualiza el inventario en Insforge</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Hamburguesa Cósmica BBQ"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Precio (COP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    placeholder="25000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Descripción / Ingredientes
                </label>
                <textarea
                  rows="2"
                  placeholder="Detalla los ingredientes y características del plato..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  URL de Imagen (Unsplash, CDN, etc.)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Image Preview */}
              {formImageUrl && (
                <div className="relative h-28 rounded-xl overflow-hidden border border-white/10 bg-dark-950">
                  <img
                    src={formImageUrl}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="absolute bottom-1 right-2 text-[10px] bg-black/70 px-2 py-0.5 rounded text-slate-300">
                    Vista previa
                  </span>
                </div>
              )}

              {/* Toggle switch for availability */}
              <div className="p-3 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Disponibilidad en Punto de Venta
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Si se desactiva, aparecerá como Agotado en el POS.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormAvailable(!formAvailable)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    formAvailable ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
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
                  <span>{editingProduct ? 'Guardar Cambios' : 'Crear Producto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-sm w-full rounded-2xl border border-rose-500/30 shadow-2xl p-6 relative text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-white text-lg">¿Eliminar Producto?</h3>
            <p className="text-xs text-slate-400 mt-2">
              ¿Estás seguro de eliminar <strong className="text-white">{productToDelete.nombre}</strong>? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                {deleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
