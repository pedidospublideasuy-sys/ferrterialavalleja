'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProductVariants from './ProductVariants';
import toast from 'react-hot-toast';

interface Category { id: string; name: string; parentId: string | null; children?: Category[] }
interface Brand { id: string; name: string }
interface ProductData {
  id?: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  shortDesc: string;
  price: string;
  comparePrice: string;
  cost: string;
  currency: string;
  stock: string;
  minStock: string;
  categoryId: string;
  brandId: string;
  typeId: string;
  images: string;
  featured: boolean;
  active: boolean;
  isNew: boolean;
  weight: string;
  dimensions: string;
  warranty: string;
  tags: string;
  specs: string;
}

const emptyProduct: ProductData = {
  name: '', sku: '', barcode: '', description: '', shortDesc: '',
  price: '', comparePrice: '', cost: '', currency: 'UYU',
  stock: '0', minStock: '0',
  categoryId: '', brandId: '', typeId: '', images: '[]',
  featured: false, active: true, isNew: false,
  weight: '', dimensions: '', warranty: '', tags: '[]', specs: '',
};

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [data, setData] = useState<ProductData>(emptyProduct);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [catRes, brandRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/brands'),
      ]);
      setCategories(await catRes.json());
      setBrands(await brandRes.json());

      if (productId) {
        const res = await fetch(`/api/admin/products/${productId}`);
        if (res.ok) {
          const p = await res.json();
          setData({
            id: p.id,
            name: p.name, sku: p.sku, barcode: p.barcode || '',
            description: p.description || '', shortDesc: p.shortDesc || '',
            price: String(p.price), comparePrice: p.comparePrice ? String(p.comparePrice) : '',
            cost: p.cost ? String(p.cost) : '',
            stock: String(p.stock), minStock: String(p.minStock || 0),
            categoryId: p.categoryId, brandId: p.brandId || '', typeId: p.typeId || '',
            images: p.images || '[]',
            featured: p.featured, active: p.active, isNew: p.isNew,
            currency: p.currency || 'UYU',
            weight: p.weight ? String(p.weight) : '',
            dimensions: p.dimensions || '', warranty: p.warranty || '',
            tags: p.tags || '[]', specs: p.specs || '',
          });
        }
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name || !data.sku || !data.price || !data.categoryId) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
      const method = productId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }

      toast.success(productId ? 'Producto actualizado' : 'Producto creado');
      router.push('/admin/productos');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productId || !confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Producto eliminado');
      router.push('/admin/productos');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div></div>;

  const set = (field: keyof ProductData, value: unknown) => setData(prev => ({ ...prev, [field]: value }));

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30 focus:border-[#e8850c]";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {productId ? 'Editar Producto' : 'Nuevo Producto'}
        </h1>
        <div className="flex gap-2">
          {productId && (
            <button type="button" onClick={handleDelete}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
              Eliminar
            </button>
          )}
          <button type="button" onClick={() => router.push('/admin/productos')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="bg-[#e8850c] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : productId ? 'Actualizar' : 'Crear Producto'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="xl:col-span-2 space-y-6">
          {/* Info básica */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Información Básica</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nombre *</label>
                <input type="text" value={data.name} onChange={e => set('name', e.target.value)} className={inputClass} placeholder="Nombre del producto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>SKU *</label>
                  <input type="text" value={data.sku} onChange={e => set('sku', e.target.value)} className={inputClass} placeholder="SKU-001" />
                </div>
                <div>
                  <label className={labelClass}>Código de barras</label>
                  <input type="text" value={data.barcode} onChange={e => set('barcode', e.target.value)} className={inputClass} placeholder="EAN-13" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Descripción corta</label>
                <input type="text" value={data.shortDesc} onChange={e => set('shortDesc', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Descripción completa</label>
                <textarea value={data.description} onChange={e => set('description', e.target.value)} rows={5} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Precios y Stock</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Moneda *</label>
                <select value={data.currency} onChange={e => set('currency', e.target.value)} className={inputClass}>
                  <option value="USD">💵 Dólares (USD)</option>
                  <option value="UYU">🪙 Pesos (UYU)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Precio ({data.currency}) *</label>
                <input type="number" step="0.01" value={data.price} onChange={e => set('price', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Precio anterior ({data.currency})</label>
                <input type="number" step="0.01" value={data.comparePrice} onChange={e => set('comparePrice', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Costo ({data.currency})</label>
                <input type="number" step="0.01" value={data.cost} onChange={e => set('cost', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Stock *</label>
                <input type="number" value={data.stock} onChange={e => set('stock', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Stock mínimo</label>
                <input type="number" value={data.minStock} onChange={e => set('minStock', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Detalles físicos */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Detalles Adicionales</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Peso (kg)</label>
                <input type="number" step="0.01" value={data.weight} onChange={e => set('weight', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Dimensiones (LxAxH)</label>
                <input type="text" value={data.dimensions} onChange={e => set('dimensions', e.target.value)} className={inputClass} placeholder="30x20x10" />
              </div>
              <div>
                <label className={labelClass}>Garantía</label>
                <input type="text" value={data.warranty} onChange={e => set('warranty', e.target.value)} className={inputClass} placeholder="12 meses" />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Especificaciones (JSON)</label>
              <textarea value={data.specs} onChange={e => set('specs', e.target.value)} rows={4} className={inputClass}
                placeholder='{"Procesador": "Intel i7", "RAM": "16GB"}' />
            </div>
          </div>

          {/* Imágenes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-3 uppercase tracking-wider">Galería de Imágenes</h2>

            {/* Upload de imágenes */}
            <div className="mb-4">
              <label className="cursor-pointer flex items-center gap-2 bg-blue-50 border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-xl px-4 py-3 text-blue-700 text-sm font-medium transition-colors w-full justify-center">
                {uploadingImg ? (
                  <><span className="animate-spin">⏳</span> Subiendo...</>
                ) : (
                  <><span>📁</span> Subir imagen (PNG, JPG, WEBP — máx 8MB)</>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  className="hidden"
                  multiple
                  disabled={uploadingImg}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    setUploadingImg(true);
                    const newUrls: string[] = [];
                    for (const file of files) {
                      const fd = new FormData();
                      fd.append('file', file);
                      if (data.id) fd.append('productId', data.id);
                      try {
                        const res = await fetch('/api/admin/upload-product-image', { method: 'POST', body: fd });
                        const result = await res.json();
                        if (result.url) newUrls.push(result.url);
                        else toast.error(result.error || 'Error al subir');
                      } catch { toast.error('Error al subir imagen'); }
                    }
                    if (newUrls.length > 0) {
                      const current: string[] = (() => { try { return JSON.parse(data.images); } catch { return []; } })();
                      set('images', JSON.stringify([...current, ...newUrls]));
                      toast.success(`${newUrls.length} imagen${newUrls.length > 1 ? 'es' : ''} subida${newUrls.length > 1 ? 's' : ''}`);
                    }
                    setUploadingImg(false);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {/* Galería actual */}
            {(() => {
              const imgs: string[] = (() => { try { return JSON.parse(data.images); } catch { return []; } })();
              return imgs.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-3">
                  {imgs.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50" style={{ paddingBottom: '100%' }}>
                      <div className="absolute inset-0">
                        <Image src={url} alt={`img-${i}`} fill className="object-contain p-1" sizes="100px" />
                      </div>
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-[#e8850c] text-white text-[8px] font-bold px-1.5 py-0.5 rounded z-10">Principal</span>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        {i > 0 && (
                          <button
                            type="button"
                            title="Mover a principal"
                            onClick={() => {
                              const arr = [...imgs];
                              arr.splice(i, 1);
                              arr.unshift(url);
                              set('images', JSON.stringify(arr));
                            }}
                            className="bg-white text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[#e8850c] hover:text-white transition-colors"
                          >⭐</button>
                        )}
                        <button
                          type="button"
                          title="Eliminar"
                          onClick={() => {
                            if (!confirm('¿Eliminar esta imagen?')) return;
                            set('images', JSON.stringify(imgs.filter((_, idx) => idx !== i)));
                          }}
                          className="bg-white text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500 hover:text-white transition-colors"
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl mb-3">Sin imágenes — subí una arriba</p>
              );
            })()}

            {/* URLs manuales */}
            <details className="text-xs">
              <summary className="text-gray-400 cursor-pointer hover:text-gray-600 select-none mb-1">+ Agregar URL manual</summary>
              <textarea
                value={(() => { try { return JSON.parse(data.images).join('\n'); } catch { return ''; } })()}
                onChange={e => set('images', JSON.stringify(e.target.value.split('\n').filter(Boolean)))}
                rows={3} className={`${inputClass} font-mono text-xs mt-1`} placeholder="https://ejemplo.com/imagen.jpg" />
            </details>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Clasificación */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Clasificación</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Categoría *</label>
                <select value={data.categoryId} onChange={e => set('categoryId', e.target.value)} className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {categories.filter(c => !c.parentId).map(c => (
                    <optgroup key={c.id} label={c.name}>
                      <option value={c.id}>{c.name}</option>
                      {c.children?.map(sub => (
                        <option key={sub.id} value={sub.id}>&nbsp;&nbsp;{sub.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Marca</label>
                <select value={data.brandId} onChange={e => set('brandId', e.target.value)} className={inputClass}>
                  <option value="">Sin marca</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Opciones */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Opciones</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={data.active} onChange={e => set('active', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#e8850c] focus:ring-[#e8850c]" />
                <span className="text-sm">Activo (visible en tienda)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={data.featured} onChange={e => set('featured', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#e8850c] focus:ring-[#e8850c]" />
                <span className="text-sm">Producto destacado</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={data.isNew} onChange={e => set('isNew', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#e8850c] focus:ring-[#e8850c]" />
                <span className="text-sm">Marcar como nuevo</span>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Tags</h2>
            <input type="text"
              value={(() => { try { return JSON.parse(data.tags).join(', '); } catch { return ''; } })()}
              onChange={e => set('tags', JSON.stringify(e.target.value.split(',').map(t => t.trim()).filter(Boolean)))}
              className={inputClass} placeholder="gaming, rgb, oferta" />
            <p className="text-xs text-gray-400 mt-1">Separados por comas</p>
          </div>
        </div>
      </div>
    </form>
      {productId && <ProductVariants productId={productId} />}
  );
}
