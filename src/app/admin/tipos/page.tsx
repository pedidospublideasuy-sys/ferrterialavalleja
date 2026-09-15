'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface ProductType { id: string; name: string; slug: string; active: boolean; _count: { products: number } }

export default function AdminTipos() {
  const [types, setTypes] = useState<ProductType[]>([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch('/api/admin/product-types');
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Error cargando tipos'); return; }
    setTypes(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const url = editing ? `/api/admin/product-types/${editing.id}` : '/api/admin/product-types';
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Error guardando'); return; }
    toast.success(editing ? 'Tipo actualizado' : 'Tipo creado');
    setName(''); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este tipo?')) return;
    const res = await fetch(`/api/admin/product-types/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Error eliminando'); return; }
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Tipos de producto</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Variantes y tipos usados para organizar productos.</p>
      <form onSubmit={save} className="bg-white rounded-xl p-5 shadow-sm flex gap-3 mb-6">
        <input value={name} onChange={e => setName(e.target.value)} required placeholder="Ej. Talle, color, capacidad" className="border rounded-lg px-3 py-2 text-sm flex-1" />
        <button className="bg-[#e8850c] text-white px-4 rounded-lg text-sm">{editing ? 'Actualizar' : 'Crear'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setName(''); }} className="border px-4 rounded-lg text-sm">Cancelar</button>}
      </form>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-6">Cargando...</div> : types.map(type => (
          <div key={type.id} className="border-b p-4 flex items-center justify-between">
            <div><b>{type.name}</b><span className="text-xs text-gray-400 ml-3">{type._count.products} productos</span></div>
            <div className="flex gap-3 text-sm"><button className="text-blue-600" onClick={() => { setEditing(type); setName(type.name); }}>Editar</button><button className="text-red-600" onClick={() => remove(type.id)}>Eliminar</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
