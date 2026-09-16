'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/store/currency';

interface ProductRow {
  id: string; name: string; slug: string; sku: string; images: string;
  price: number; cost: number | null; stock: number; minStock: number; currency?: string | null; sourceApi?: string | null;
  active: boolean; featured: boolean; isNew: boolean;
  category: { name: string } | null; brand: { name: string } | null;
}

export default function ProductListTable({ products }: { products: ProductRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const format = useCurrency((state) => state.format);
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const allSelected = products.length > 0 && selected.length === products.length;
  const selectAll = () => setSelected(allSelected ? [] : products.map(product => product.id));
  const deleteProducts = async (ids: string[]) => {
    if (!ids.length || !confirm(`¿Eliminar ${ids.length} producto${ids.length === 1 ? '' : 's'}?`)) return;
    setDeleting(true);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron eliminar');
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudieron eliminar');
      setDeleting(false);
    }
  };
  const deleteAllProducts = async () => {
    if (!confirm('¿Eliminar TODOS los productos del catálogo? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron eliminar');
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudieron eliminar');
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-3">
        <span className="text-sm text-orange-800">{selected.length > 0 ? `${selected.length} seleccionado${selected.length === 1 ? '' : 's'}` : 'Gestión del catálogo'}</span>
        <div className="flex gap-2">
          {selected.length > 0 && <button onClick={() => deleteProducts(selected)} disabled={deleting} className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold">{deleting ? 'Eliminando...' : 'Eliminar seleccionados'}</button>}
          <button onClick={deleteAllProducts} disabled={deleting} className="border border-red-600 text-red-700 px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-600 hover:text-white">{deleting ? 'Eliminando...' : 'Eliminar todos'}</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 bg-gray-50 text-xs uppercase tracking-wider">
            <th className="p-4"><input type="checkbox" checked={allSelected} onChange={selectAll} aria-label="Seleccionar todos" /></th>
            <th className="p-4">Imagen</th><th className="p-4">SKU</th><th className="p-4">Nombre</th><th className="p-4">Categoría</th><th className="p-4">Marca</th><th className="p-4 text-right">Precio</th><th className="p-4 text-right">Costo</th><th className="p-4 text-center">Stock</th><th className="p-4 text-center">Estado</th><th className="p-4 text-center">Acciones</th>
          </tr></thead>
          <tbody>
            {products.map(product => {
              let image = '';
              try {
                const parsed = JSON.parse(product.images || '[]');
                const first = Array.isArray(parsed) ? parsed[0] : null;
                image = typeof first === 'string' ? first : first?.url || first?.src || first?.img || '';
              } catch { /* invalid image data */ }
              return <tr key={product.id} className="border-t hover:bg-gray-50">
                <td className="p-4"><input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggle(product.id)} aria-label={`Seleccionar ${product.name}`} /></td>
                <td className="p-4"><div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">{image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>}</div></td>
                <td className="p-4 font-mono text-xs text-gray-500">{product.sku}</td>
                <td className="p-4"><Link href={`/admin/productos/${product.id}`} className="font-medium text-gray-900 hover:text-[#e8850c]">{product.name}</Link><div className="flex gap-1 mt-1">{product.featured && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 rounded">Destacado</span>}{product.isNew && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 rounded">Nuevo</span>}</div></td>
                <td className="p-4 text-gray-500">{product.category?.name || '-'}</td><td className="p-4 text-gray-500">{product.brand?.name || '-'}</td>
                <td className="p-4 text-right font-medium">{format(product.price, product.sourceApi ? 'UYU' : product.currency === 'USD' ? 'USD' : 'UYU')}</td><td className="p-4 text-right text-gray-400">{product.cost ? format(product.cost, product.sourceApi ? 'UYU' : product.currency === 'USD' ? 'USD' : 'UYU') : '-'}</td>
                <td className="p-4 text-center"><span className={`font-medium ${product.stock <= product.minStock ? 'text-red-600' : product.stock <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>{product.stock}</span></td>
                <td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{product.active ? 'Activo' : 'Inactivo'}</span></td>
                <td className="p-4 text-center"><div className="flex justify-center gap-2"><Link href={`/admin/productos/${product.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</Link><button onClick={() => deleteProducts([product.id])} disabled={deleting} className="text-red-600 hover:text-red-800 text-xs font-medium">Eliminar</button></div></td>
              </tr>;
            })}
            {products.length === 0 && <tr><td colSpan={11} className="py-12 text-center text-gray-400">No se encontraron productos</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
