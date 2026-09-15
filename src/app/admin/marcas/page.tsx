'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  active: boolean;
  _count: { products: number };
}

export default function AdminMarcas() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', logo: '', website: '', active: true });

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/brands');
    setBrands(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ name: '', logo: '', website: '', active: true });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (b: Brand) => {
    setEditing(b);
    setForm({ name: b.name, logo: b.logo || '', website: b.website || '', active: b.active });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }

    try {
      const url = editing ? `/api/admin/brands/${editing.id}` : '/api/admin/brands';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }

      toast.success(editing ? 'Marca actualizada' : 'Marca creada');
      resetForm();
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta marca?')) return;
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Marca eliminada');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleLogoUpload = async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    const res = await fetch('/api/admin/upload-banner', { method: 'POST', body: data });
    const result = await res.json();
    if (!res.ok || !result.url) throw new Error(result.error || 'No se pudo subir el logo');
    setForm(f => ({ ...f, logo: result.url }));
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30";

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Marcas</h1>
          <p className="text-sm text-gray-500 mt-1">{brands.length} marcas registradas</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#e8850c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors">
          + Nueva Marca
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-bold text-sm text-gray-800 mb-4">{editing ? 'Editar Marca' : 'Nueva Marca'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Logo URL</label>
              <input type="text" value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} className={inputClass} placeholder="https://..." />
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="mt-2 block w-full text-xs"
                onChange={e => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file).catch(err => toast.error(err instanceof Error ? err.message : 'Error al subir logo')); }} />
              {form.logo && <div className="mt-2 flex items-center gap-2"><img src={form.logo} alt="Vista previa" className="h-10 w-20 object-contain border rounded" /><button type="button" onClick={() => setForm(f => ({ ...f, logo: '' }))} className="text-xs text-red-600">Quitar</button></div>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Website</label>
              <input type="text" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className={inputClass} placeholder="https://..." />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-sm">Activa</span>
              </label>
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex gap-2">
              <button type="submit" className="bg-[#e8850c] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b]">
                {editing ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {brands.map(b => (
          <div key={b.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              {b.logo ? (
                <img src={b.logo} alt={b.name} className="w-10 h-10 object-contain rounded" />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 font-bold text-lg">
                  {b.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{b.name}</h3>
                <p className="text-xs text-gray-400">{b._count.products} productos</p>
              </div>
              <span className={`w-2 h-2 rounded-full ${b.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            </div>
            {b.website && (
              <a href={b.website} target="_blank" rel="noopener" className="text-xs text-blue-500 hover:underline block truncate mb-3">
                {b.website}
              </a>
            )}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button onClick={() => startEdit(b)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
              <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
            </div>
          </div>
        ))}
        {brands.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">No hay marcas aún</div>
        )}
      </div>
    </div>
  );
}
