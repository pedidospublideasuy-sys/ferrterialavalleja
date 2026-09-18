'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export interface Variant {
  id: string; // If draft, we can generate a random temp id like 'temp-...'
  name: string;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  attributes: string;
  active: boolean;
  imageUrl?: string | null;
}

interface ProductVariantsProps {
  productId?: string;
  draftVariants?: Variant[];
  onDraftVariantsChange?: (variants: Variant[]) => void;
}

export default function ProductVariants({ productId, draftVariants, onDraftVariantsChange }: ProductVariantsProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(!!productId); // only load if productId exists
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const emptyVariant = { name: '', sku: '', price: '', comparePrice: '', stock: '0', attributes: '{}', active: true, imageUrl: '' };
  const [newVariant, setNewVariant] = useState(emptyVariant);

  const loadVariants = async () => {
    if (!productId) return;
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
    if (productId) {
      loadVariants();
    } else if (draftVariants) {
      setVariants(draftVariants);
      setLoading(false);
    }
  }, [productId, draftVariants]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (productId) fd.append('productId', productId);
      
      const res = await fetch('/api/admin/upload-product-image', { method: 'POST', body: fd });
      const result = await res.json();
      
      if (result.url) {
        setNewVariant(prev => ({ ...prev, imageUrl: result.url }));
        toast.success('Imagen de variante subida');
      } else {
        toast.error(result.error || 'Error al subir');
      }
    } catch (err) {
      toast.error('Error al subir imagen');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  const handleEditClick = (v: Variant) => {
    setEditingId(v.id);
    setNewVariant({
      name: v.name,
      sku: v.sku || '',
      price: String(v.price),
      comparePrice: v.comparePrice ? String(v.comparePrice) : '',
      stock: String(v.stock),
      attributes: v.attributes,
      active: v.active,
      imageUrl: v.imageUrl || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewVariant(emptyVariant);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariant.name || !newVariant.price) {
      toast.error('Nombre y precio son obligatorios');
      return;
    }
    
    setSaving(true);
    
    const payload = {
      name: newVariant.name,
      sku: newVariant.sku || null,
      price: parseFloat(newVariant.price),
      comparePrice: newVariant.comparePrice ? parseFloat(newVariant.comparePrice) : null,
      stock: parseInt(newVariant.stock || '0'),
      attributes: newVariant.attributes,
      active: newVariant.active,
      imageUrl: newVariant.imageUrl || null
    };
    
    if (productId) {
      // Server mode
      try {
        let url = `/api/admin/products/${productId}/variants`;
        let method = 'POST';
        
        if (editingId) {
          url = `/api/admin/products/${productId}/variants/${editingId}`;
          method = 'PUT';
        }
        
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          toast.success(editingId ? 'Variante actualizada' : 'Variante agregada');
          setNewVariant(emptyVariant);
          setEditingId(null);
          loadVariants();
        } else {
          throw new Error(await res.text());
        }
      } catch (e: any) {
        toast.error(e.message || 'Error al guardar');
      } finally {
        setSaving(false);
      }
    } else {
      // Draft mode
      let newList = [...variants];
      
      if (editingId) {
        newList = newList.map(v => v.id === editingId ? { ...v, ...payload } : v);
        toast.success('Variante actualizada (borrador)');
      } else {
        const tempVariant: Variant = {
          id: 'draft-' + Date.now(),
          ...payload
        };
        newList.push(tempVariant);
        toast.success('Variante agregada (borrador)');
      }
      
      setVariants(newList);
      if (onDraftVariantsChange) {
        onDraftVariantsChange(newList);
      }
      setNewVariant(emptyVariant);
      setEditingId(null);
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar variante?')) return;
    
    if (productId) {
      // Server mode
      try {
        const res = await fetch(`/api/admin/products/${productId}/variants/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Variante eliminada');
          loadVariants();
          if (editingId === id) handleCancelEdit();
        }
      } catch (e) {
        toast.error('Error al eliminar');
      }
    } else {
      // Draft mode
      const newList = variants.filter(v => v.id !== id);
      setVariants(newList);
      if (onDraftVariantsChange) {
        onDraftVariantsChange(newList);
      }
      if (editingId === id) handleCancelEdit();
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-12">Img</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Precio</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {variants.map(v => (
                <tr key={v.id} className={editingId === v.id ? 'bg-orange-50' : ''}>
                  <td className="px-4 py-2 text-sm">
                    {v.imageUrl ? (
                      <div className="relative w-8 h-8 rounded overflow-hidden border">
                        <Image src={v.imageUrl} alt={v.name} fill className="object-cover" sizes="32px" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">-</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">{v.name}</td>
                  <td className="px-4 py-2 text-sm">{v.sku || '-'}</td>
                  <td className="px-4 py-2 text-sm">${v.price}</td>
                  <td className="px-4 py-2 text-sm">{v.stock}</td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={() => handleEditClick(v)} className="text-[#e8850c] text-xs mr-3 font-medium">Editar</button>
                    <button type="button" onClick={() => handleDelete(v.id)} className="text-red-500 text-xs">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-xs font-bold text-gray-600 mb-3">
          {editingId ? 'Editar Variante' : 'Agregar Nueva Variante'}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs mb-1">Imagen (Opcional)</label>
            <div className="flex items-center gap-2">
              {newVariant.imageUrl && (
                <div className="relative w-8 h-8 rounded overflow-hidden border shrink-0">
                  <Image src={newVariant.imageUrl} alt="preview" fill className="object-cover" sizes="32px" />
                </div>
              )}
              <label className="cursor-pointer bg-white border rounded px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                {uploadingImg ? 'Subiendo...' : (newVariant.imageUrl ? 'Cambiar img' : 'Subir img')}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
              </label>
            </div>
            {newVariant.imageUrl && (
              <button type="button" onClick={() => setNewVariant({...newVariant, imageUrl: ''})} className="text-[10px] text-red-500 mt-1 block">Quitar imagen</button>
            )}
          </div>
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
        
        <div className="mt-3 flex justify-end gap-2">
          {editingId && (
            <button type="button" onClick={handleCancelEdit} className="bg-white border text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-50">
              Cancelar
            </button>
          )}
          <button type="submit" disabled={saving || uploadingImg} className="bg-[#e8850c] text-white px-4 py-1.5 rounded text-sm hover:bg-[#d47a0b]">
            {saving ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Agregar variante')}
          </button>
        </div>
      </form>
    </div>
  );
}

