'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Variant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  attributes: string;
  active: boolean;
}

export default function ProductVariants({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newVariant, setNewVariant] = useState({ name: '', sku: '', price: '', comparePrice: '', stock: '0', attributes: '{}', active: true });

  const loadVariants = async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`);
      if (res.ok) {
        setVariants(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariant.name || !newVariant.price) {
      toast.error('Nombre y precio son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVariant),
      });
      if (res.ok) {
        toast.success('Variante agregada');
        setNewVariant({ name: '', sku: '', price: '', comparePrice: '', stock: '0', attributes: '{}', active: true });
        loadVariants();
      } else {
        throw new Error(await res.text());
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar variante?')) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Variante eliminada');
        loadVariants();
      }
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Cargando variantes...</div>;

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30 focus:border-[#e8850c]";

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
      <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Variantes (Colores, Medidas)</h2>
      
      {variants.length > 0 && (
        <div className="mb-6 border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Precio</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {variants.map(v => (
                <tr key={v.id}>
                  <td className="px-4 py-2 text-sm">{v.name}</td>
                  <td className="px-4 py-2 text-sm">{v.sku || '-'}</td>
                  <td className="px-4 py-2 text-sm">${v.price}</td>
                  <td className="px-4 py-2 text-sm">{v.stock}</td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={() => handleDelete(v.id)} className="text-red-500 text-xs">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-xs font-bold text-gray-600 mb-3">Agregar Nueva Variante</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs mb-1">Nombre * (ej: Blanco)</label>
            <input type="text" value={newVariant.name} onChange={e => setNewVariant({...newVariant, name: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs mb-1">SKU</label>
            <input type="text" value={newVariant.sku} onChange={e => setNewVariant({...newVariant, sku: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs mb-1">Precio *</label>
            <input type="number" step="0.01" value={newVariant.price} onChange={e => setNewVariant({...newVariant, price: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs mb-1">Stock</label>
            <input type="number" value={newVariant.stock} onChange={e => setNewVariant({...newVariant, stock: e.target.value})} className={inputClass} />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="submit" disabled={saving} className="bg-[#e8850c] text-white px-4 py-1.5 rounded text-sm hover:bg-[#d47a0b]">
            {saving ? 'Agregando...' : 'Agregar variante'}
          </button>
        </div>
      </form>
    </div>
  );
}
