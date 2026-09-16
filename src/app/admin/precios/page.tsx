'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useCurrency } from '@/store/currency';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  cost: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  images: string;
  sourceApi: string | null;
  sourceId: string | null;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
}

interface FilterOption { id: string; name: string; }

export default function PreciosPage() {
  const formatCurrency = useCurrency((state) => state.format);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filtros
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [source, setSource] = useState('');

  // Selección
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Ajuste masivo
  const [massAction, setMassAction] = useState('markup_from_cost');
  const [massPercentage, setMassPercentage] = useState('40');
  const [pendingConfirm, setPendingConfirm] = useState(false);

  // Edición inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editCompare, setEditCompare] = useState('');
  const [editCost, setEditCost] = useState('');

  // Backups / Restaurar
  const [backups, setBackups] = useState<{ id: string; label: string; count: number; createdAt: string }[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      if (brandId) params.set('brandId', brandId);
      if (source) params.set('source', source);
      params.set('page', String(page));
      params.set('limit', '50');
      const res = await fetch('/api/admin/pricing?' + params.toString());
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setCategories(data.categories || []);
      setBrands(data.brands || []);
    } catch {
      toast.error('Error cargando productos');
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, brandId, source, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Selección
  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
    setSelectAll(false);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(products.map(p => p.id)));
      setSelectAll(true);
    }
  };

  // Aplicar ajuste masivo
  const applyMassAction = async () => {
    const pct = parseFloat(massPercentage);
    if (isNaN(pct) || pct < 0) {
      toast.error('Ingresá un porcentaje válido');
      return;
    }

    const productIds = selected.size > 0 ? Array.from(selected) : undefined;
    const count = productIds ? productIds.length : total;

    const actionLabels: Record<string, string> = {
      markup_from_cost: 'Marcar precio = costo + ' + pct + '%',
      increase: 'Aumentar precio ' + pct + '%',
      decrease: 'Reducir precio ' + pct + '%',
      set_compare: 'Crear oferta con ' + pct + '% descuento',
      clear_compare: 'Quitar precio tachado (oferta)',
    };

    const label = actionLabels[massAction] || massAction;
    // ya confirmado — ejecutar
    setPendingConfirm(false);
    setApplying(true);
    try {
      const body: any = {
        action: massAction,
        percentage: pct,
      };
      if (productIds) body.productIds = productIds;
      if (!productIds) {
        if (categoryId) body.categoryId = categoryId;
        if (brandId) body.brandId = brandId;
        if (source) body.source = source;
      }

      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSelected(new Set());
        setSelectAll(false);
        fetchProducts();
      } else {
        toast.error(data.error || 'Error aplicando cambio');
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setApplying(false);
    }
  };

  // Edición inline
  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditPrice(String(product.price));
    setEditCompare(product.comparePrice ? String(product.comparePrice) : '');
    setEditCost(product.cost ? String(product.cost) : '');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: editingId,
          price: editPrice,
          comparePrice: editCompare || null,
          cost: editCost || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Precio actualizado');
        setEditingId(null);
        fetchProducts();
      } else {
        toast.error(data.error || 'Error');
      }
    } catch {
      toast.error('Error de red');
    }
  };

  const cancelEdit = () => setEditingId(null);

  // Backup / Restaurar
  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/admin/pricing/backup');
      const data = await res.json();
      setBackups(data.backups || []);
    } catch { toast.error('Error cargando backups'); }
  };

  const restoreBackup = async (backupId: string) => {
    setRestoring(true);
    try {
      const res = await fetch('/api/admin/pricing/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchProducts();
        fetchBackups();
      } else {
        toast.error(data.error || 'Error restaurando');
      }
    } catch { toast.error('Error de red'); }
    setRestoring(false);
  };

  const deleteBackup = async (id: string) => {
    try {
      await fetch('/api/admin/pricing/backup?id=' + id, { method: 'DELETE' });
      setBackups(prev => prev.filter(b => b.id !== id));
      toast.success('Backup eliminado');
    } catch { toast.error('Error'); }
  };

  const createManualBackup = async () => {
    setRestoring(true);
    try {
      const res = await fetch('/api/admin/pricing/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', label: `Backup manual (${total} productos)` }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchBackups();
      } else {
        toast.error(data.error || 'Error creando backup');
      }
    } catch { toast.error('Error de red'); }
    setRestoring(false);
  };

  // Helpers
  const getMargin = (p: Product) => {
    if (!p.cost || p.cost <= 0) return null;
    return ((p.price - p.cost) / p.cost * 100).toFixed(1);
  };

  const getImage = (p: Product) => {
    try {
      const imgs = JSON.parse(p.images);
      return Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null;
    } catch { return null; }
  };

  const fmt = (n: number) => formatCurrency(n, 'UYU');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Precios y Márgenes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ajustá precios en masa o individualmente. {total} productos en total.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={createManualBackup}
            disabled={restoring}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            💾 Generar Backup
          </button>
          <button
            onClick={() => { setShowBackups(!showBackups); if (!showBackups) fetchBackups(); }}
            className="bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            🔄 {showBackups ? 'Ocultar backups' : 'Restaurar precios'}
          </button>
        </div>
      </div>

      {/* Panel de Backups / Restaurar */}
      {showBackups && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">🔄 Historial de Backups</h2>
          <p className="text-xs text-gray-400 mb-4">Cada vez que aplicás un cambio masivo se crea un backup automático. Podés restaurar cualquiera.</p>

          {backups.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm">No hay backups todavía</p>
              <p className="text-xs mt-1">Se creará uno automáticamente la próxima vez que apliques un cambio masivo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((b) => (
                <div key={b.id} className="flex items-center gap-3 border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{b.label}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(b.createdAt).toLocaleString('es-UY', { dateStyle: 'medium', timeStyle: 'short' })} · {b.count} productos
                    </p>
                  </div>
                  <button
                    onClick={() => restoreBackup(b.id)}
                    disabled={restoring}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {restoring ? '⏳...' : '↩ Restaurar'}
                  </button>
                  <button
                    onClick={() => deleteBackup(b.id)}
                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1.5"
                    title="Eliminar backup"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Panel de ajuste masivo */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">⚡ Ajuste Masivo de Precios</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Acción</label>
            <select
              value={massAction}
              onChange={(e) => setMassAction(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
            >
              <option value="markup_from_cost">📈 Margen sobre costo</option>
              <option value="increase">⬆️ Aumentar precio actual %</option>
              <option value="decrease">⬇️ Reducir precio actual %</option>
              <option value="set_compare">🏷️ Crear oferta (descuento %)</option>
              <option value="clear_compare">❌ Quitar precio oferta</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {massAction === 'clear_compare' ? 'Sin porcentaje' : 'Porcentaje (%)'}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={massPercentage}
              onChange={(e) => setMassPercentage(e.target.value)}
              disabled={massAction === 'clear_compare'}
              placeholder="Ej: 40"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Aplicar a</label>
            <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border">
              {selected.size > 0
                ? selected.size + ' seleccionados'
                : 'Todos los filtrados (' + total + ')'}
            </div>
          </div>
          <div>
            {pendingConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={applyMassAction}
                  disabled={applying}
                  className="flex-1 bg-red-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  {applying ? '⏳...' : '✓ Confirmar'}
                </button>
                <button
                  onClick={() => setPendingConfirm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPendingConfirm(true)}
                disabled={applying}
                className="w-full bg-[#e8850c] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#d47a0b] transition-colors disabled:opacity-50 text-sm"
              >
                {applying ? '⏳ Aplicando...' : '🚀 Aplicar Cambio'}
              </button>
            )}
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>💡 Margen sobre costo proveedor:</strong> Toma el precio de costo original del proveedor y le suma el % que indiques.
            Ejemplo: Costo = USD 100, Margen 40% → Precio venta = USD 140.
            {selected.size > 0 && (<span className="font-bold"> Se aplicará solo a los {selected.size} productos seleccionados.</span>)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
          />
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <select
            value={brandId}
            onChange={(e) => { setBrandId(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
          >
            <option value="">Todas las marcas</option>
            {brands.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
          <select
            value={source}
            onChange={(e) => { setSource(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
          >
            <option value="">Todos los orígenes</option>
            <option value="api">Solo Proveedor API</option>
          </select>
          <button
            onClick={() => { setSearch(''); setCategoryId(''); setBrandId(''); setSource(''); setPage(1); }}
            className="text-sm text-gray-500 hover:text-gray-800 border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-3 w-10">
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="text-left p-3 w-12"></th>
                <th className="text-left p-3">Producto</th>
                <th className="text-left p-3">SKU</th>
                <th className="text-left p-3">Categoría</th>
                <th className="text-right p-3">Costo</th>
                <th className="text-right p-3">Precio Venta</th>
                <th className="text-right p-3">Precio Oferta</th>
                <th className="text-right p-3">Margen %</th>
                <th className="text-center p-3">Stock</th>
                <th className="text-center p-3">Origen</th>
                <th className="text-center p-3 w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="p-8 text-center text-gray-400">Cargando productos...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={12} className="p-8 text-center text-gray-400">No se encontraron productos</td></tr>
              ) : products.map((product) => {
                const margin = getMargin(product);
                const img = getImage(product);
                const isEditing = editingId === product.id;

                return (
                  <tr key={product.id} className={"border-b hover:bg-orange-50/40 transition-colors" + (selected.has(product.id) ? " bg-orange-50" : "")}>
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleSelect(product.id)} className="rounded" />
                    </td>
                    <td className="p-3">
                      {img ? (
                        <img src={img} alt="" className="w-10 h-10 object-contain rounded border" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs">📦</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-800 max-w-[250px] truncate" title={product.name}>{product.name}</div>
                      <div className="text-xs text-gray-400">{product.brand?.name || ''}</div>
                    </td>
                    <td className="p-3 text-gray-500 font-mono text-xs">{product.sku}</td>
                    <td className="p-3 text-gray-500 text-xs">{product.category?.name || '-'}</td>

                    <td className="p-3 text-right">
                      {isEditing ? (
                        <input type="number" step="0.01" value={editCost} onChange={(e) => setEditCost(e.target.value)}
                          className="w-24 border rounded px-2 py-1 text-sm text-right focus:ring-2 focus:ring-orange-300" />
                      ) : (
                        <span className="text-gray-500">{product.cost ? fmt(product.cost) : '-'}</span>
                      )}
                    </td>

                    {/* Precio venta */}
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24 border rounded px-2 py-1 text-sm text-right focus:ring-2 focus:ring-orange-300 font-bold" />
                      ) : (
                        <span className="font-bold text-gray-800">{fmt(product.price)}</span>
                      )}
                    </td>

                    {/* Precio oferta / compare */}
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <input type="number" step="0.01" value={editCompare} onChange={(e) => setEditCompare(e.target.value)}
                          placeholder="Tachado"
                          className="w-24 border rounded px-2 py-1 text-sm text-right focus:ring-2 focus:ring-orange-300" />
                      ) : product.comparePrice ? (
                        <span className="text-red-500 line-through text-xs">{fmt(product.comparePrice)}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>

                    {/* Margen */}
                    <td className="p-3 text-right">
                      {margin !== null ? (
                        <span className={"font-semibold text-xs px-2 py-0.5 rounded-full " +
                          (parseFloat(margin) >= 30 ? "bg-green-100 text-green-700" :
                           parseFloat(margin) >= 15 ? "bg-yellow-100 text-yellow-700" :
                           parseFloat(margin) >= 0 ? "bg-orange-100 text-orange-700" :
                           "bg-red-100 text-red-700")
                        }>{margin}%</span>
                      ) : (<span className="text-gray-300">-</span>)}
                    </td>

                    {/* Stock */}
                    <td className="p-3 text-center">
                      <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " +
                        (product.stock > 5 ? "bg-green-100 text-green-700" :
                         product.stock > 0 ? "bg-yellow-100 text-yellow-700" :
                         "bg-red-100 text-red-700")
                      }>{product.stock}</span>
                    </td>

                    {/* Origen */}
                    <td className="p-3 text-center">
                      {product.sourceApi === 'provider-api' ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">API</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Manual</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={saveEdit} className="text-green-600 hover:text-green-800 text-lg" title="Guardar">✓</button>
                          <button onClick={cancelEdit} className="text-red-500 hover:text-red-700 text-lg" title="Cancelar">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(product)} className="text-gray-400 hover:text-[#e8850c] text-sm" title="Editar precio">✏️</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-500">
              Página {page} de {pages} — {total} productos
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-40"
              >← Anterior</button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-40"
              >Siguiente →</button>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">📈 Margen sobre costo</h3>
          <p className="text-xs text-gray-500">Toma el costo original del proveedor y calcula el precio de venta sumando el porcentaje indicado. Ideal para establecer tu margen de ganancia base.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">🏷️ Crear ofertas</h3>
          <p className="text-xs text-gray-500">Mueve el precio actual al "precio tachado" y aplica el descuento indicado al precio de venta. Los clientes ven el precio original tachado y el nuevo precio con descuento.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">⬆️ Aumento / ⬇️ Reducción</h3>
          <p className="text-xs text-gray-500">Aumenta o reduce el precio de venta actual por el porcentaje indicado. Útil para ajustes por inflación o promociones rápidas.</p>
        </div>
      </div>
    </div>
  );
}