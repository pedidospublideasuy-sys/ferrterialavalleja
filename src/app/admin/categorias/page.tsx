'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  active: boolean;
  children: Category[];
  _count: { products: number };
}

export default function AdminCategorias() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', image: '', icon: '', parentId: '', sortOrder: 0, active: true });

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/categories');
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ name: '', description: '', image: '', icon: '', parentId: '', sortOrder: 0, active: true });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      icon: cat.icon || '',
      parentId: cat.parentId || '',
      sortOrder: cat.sortOrder,
      active: cat.active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }

    try {
      const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }

      toast.success(editing ? 'Categoría actualizada' : 'Categoría creada');
      resetForm();
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Categoría eliminada');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleImageUpload = async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    const res = await fetch('/api/admin/upload-banner', { method: 'POST', body: data });
    const result = await res.json();
    if (!res.ok || !result.url) throw new Error(result.error || 'No se pudo subir la imagen');
    setForm(f => ({ ...f, image: result.url }));
  };

  const parents = categories.filter(c => !c.parentId);
  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30";

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} categorías</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#e8850c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors">
          + Nueva Categoría
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-bold text-sm text-gray-800 mb-4">{editing ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Categoría padre</label>
              <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))} className={inputClass}>
                <option value="">Ninguna (raíz)</option>
                {parents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Imagen o URL del ícono</label>
              <input type="url" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className={inputClass} placeholder="https://..." />
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="mt-2 block w-full text-xs"
                onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file).catch(err => toast.error(err instanceof Error ? err.message : 'Error al subir imagen')); }} />
              {form.image && (
                <div className="mt-2 flex items-center gap-2">
                 <img src={form.image} alt="Vista previa" className="h-12 w-20 rounded border object-cover" />
                 <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))} className="text-xs text-red-600 hover:underline">Quitar imagen</button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Orden</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className={inputClass} />
            </div>
            <div className="flex items-end gap-2">
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

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 text-xs uppercase tracking-wider">
              <th className="p-4">Nombre</th>
              <th className="p-4">Subcategorías</th>
              <th className="p-4 text-center">Productos</th>
              <th className="p-4 text-center">Orden</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {parents.map((cat) => (
              <>
                <tr key={cat.id} className="border-t hover:bg-gray-50 bg-gray-50/50">
                  <td className="p-4 font-semibold text-gray-900">{cat.name}</td>
                  <td className="p-4 text-gray-500">{cat.children.length} subcategorías</td>
                  <td className="p-4 text-center">{cat._count.products}</td>
                  <td className="p-4 text-center text-gray-400">{cat.sortOrder}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="p-4 text-center space-x-2">
                    <button onClick={() => startEdit(cat)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                  </td>
                </tr>
                {cat.children.map(sub => (
                  <tr key={sub.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 pl-10 text-gray-700">↳ {sub.name}</td>
                    <td className="p-4 text-gray-400">-</td>
                    <td className="p-4 text-center">{sub._count?.products || 0}</td>
                    <td className="p-4 text-center text-gray-400">{sub.sortOrder}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {sub.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button onClick={() => startEdit(sub)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                      <button onClick={() => handleDelete(sub.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </>
            ))}
            {parents.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400">No hay categorías aún</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
