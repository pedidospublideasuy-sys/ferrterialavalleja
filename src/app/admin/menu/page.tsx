'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpIcon, ArrowDownIcon, EyeIcon, EyeSlashIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface SubCategory {
  id: string; name: string; slug: string; showInMenu: boolean; menuOrder: number; icon: string | null;
}
interface CategoryItem {
  id: string; name: string; slug: string; showInMenu: boolean; menuOrder: number; icon: string | null;
  children: SubCategory[]; _count: { products: number };
}
interface MenuItem {
  id: string; label: string; href: string; icon: string | null;
  sortOrder: number; active: boolean; openNew: boolean; children: MenuItem[];
  location?: string;
}

type FooterLocation = 'footer_nosotros' | 'footer_tienda' | 'footer_ayuda';
const FOOTER_SECTIONS: { key: FooterLocation; label: string }[] = [
  { key: 'footer_nosotros', label: 'Nosotros' },
  { key: 'footer_tienda', label: 'Tienda' },
  { key: 'footer_ayuda', label: 'Ayuda' },
];

const BLANK_ITEM = { label: '', href: '', icon: '', sortOrder: 0, active: true, openNew: false };

export default function AdminMenu() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [footerItems, setFooterItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'categories' | 'placement' | 'custom' | 'footer'>('categories');
  const [menuCategories, setMenuCategories] = useState<string[]>([]);
  const [hamburgerCategories, setHamburgerCategories] = useState<string[]>([]);

  // Form para items header custom y footer
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState(BLANK_ITEM);
  const [formLocation, setFormLocation] = useState<string>('header');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/menu');
      const data = await res.json();
      setCategories(data.categories || []);
      setMenuItems(data.menuItems || []);
      setFooterItems(data.footerItems || []);
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settings = await settingsRes.json() as { key: string; value: string }[];
        const values = Object.fromEntries(settings.map(setting => [setting.key, setting.value]));
        try {
          const parsed = values.menu_categories === undefined ? [] : JSON.parse(values.menu_categories);
          setMenuCategories(Array.isArray(parsed) ? parsed : []);
        } catch { setMenuCategories([]); }
        try {
          const parsed = values.hamburger_categories === undefined ? [] : JSON.parse(values.hamburger_categories);
          setHamburgerCategories(Array.isArray(parsed) ? parsed : []);
        } catch { setHamburgerCategories([]); }
      }
    } catch { toast.error('Error al cargar menÃº'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ======= CATEGORÃAS =======
  const toggleCategoryMenu = (catId: string) => setCategories(prev => prev.map(c => c.id === catId ? { ...c, showInMenu: !c.showInMenu } : c));
  const toggleSubMenu = (parentId: string, subId: string) => setCategories(prev => prev.map(c =>
    c.id === parentId ? { ...c, children: c.children.map(s => s.id === subId ? { ...s, showInMenu: !s.showInMenu } : s) } : c
  ));
  const moveCat = (index: number, dir: -1 | 1) => setCategories(prev => {
    const arr = [...prev]; const target = index + dir;
    if (target < 0 || target >= arr.length) return arr;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    return arr.map((c, i) => ({ ...c, menuOrder: i }));
  });

  const saveCategories = async () => {
    setSaving(true);
    try {
      const flat = categories.flatMap((c, i) => [
        { id: c.id, showInMenu: c.showInMenu, menuOrder: i },
        ...c.children.map((s, j) => ({ id: s.id, showInMenu: s.showInMenu, menuOrder: j })),
      ]);
      const res = await fetch('/api/admin/menu', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: flat }) });
      if (!res.ok) throw new Error();
      const payload: Record<string, string> = {};
      if (Array.isArray(menuCategories) && menuCategories.length > 0) payload.menu_categories = JSON.stringify(menuCategories);
      if (Array.isArray(hamburgerCategories) && hamburgerCategories.length > 0) payload.hamburger_categories = JSON.stringify(hamburgerCategories);
      const settingsRes = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });
      if (!settingsRes.ok) throw new Error();
      toast.success('MenÃº de categorÃ­as guardado');
    } catch { toast.error('Error al guardar'); }
    setSaving(false);
  };

  // ======= ITEMS (header custom + footer) =======
  const resetItemForm = () => { setItemForm(BLANK_ITEM); setEditingItem(null); setShowItemForm(false); };

  const startEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({ label: item.label, href: item.href, icon: item.icon || '', sortOrder: item.sortOrder, active: item.active, openNew: item.openNew });
    setFormLocation(item.location || 'header');
    setShowItemForm(true);
  };

  const openNewItemForm = (location: string) => {
    resetItemForm();
    setFormLocation(location);
    setShowItemForm(true);
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.label || !itemForm.href) { toast.error('Nombre y URL son obligatorios'); return; }
    try {
      const url = editingItem ? `/api/admin/menu/items/${editingItem.id}` : '/api/admin/menu/items';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...itemForm, location: formLocation }) });
      if (!res.ok) throw new Error();
      toast.success(editingItem ? 'Item actualizado' : 'Item creado');
      resetItemForm();
      load();
    } catch { toast.error('Error al guardar item'); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Â¿Eliminar este item del menÃº?')) return;
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Item eliminado');
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  const visibleCats = categories.filter(c => c.showInMenu);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div>
    </div>
  );

  const ItemForm = () => (
    <div className="p-4 border-b bg-[#fef9f4]">
      <form onSubmit={saveItem} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
          <input type="text" value={itemForm.label} onChange={e => setItemForm(f => ({ ...f, label: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" placeholder="Ej: Ofertas" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">URL *</label>
          <input type="text" value={itemForm.href} onChange={e => setItemForm(f => ({ ...f, href: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" placeholder="Ej: /productos?sort=price_asc" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ãcono (emoji)</label>
          <input type="text" value={itemForm.icon} onChange={e => setItemForm(f => ({ ...f, icon: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" placeholder="ðŸ”¥" />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={itemForm.active} onChange={e => setItemForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded" />
            Activo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={itemForm.openNew} onChange={e => setItemForm(f => ({ ...f, openNew: e.target.checked }))} className="w-4 h-4 rounded" />
            Nueva pestaÃ±a
          </label>
        </div>
        <div className="md:col-span-2 flex items-end gap-2">
          <button type="submit" className="bg-[#e8850c] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b]">
            {editingItem ? 'Actualizar' : 'Crear'}
          </button>
          <button type="button" onClick={resetItemForm} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">Cancelar</button>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">MenÃº y NavegaciÃ³n</h1>
          <p className="text-sm text-gray-500 mt-1">Configura categorÃ­as, links de navegaciÃ³n y columnas del footer</p>
        </div>
      </div>

      {/* Preview del menÃº */}
      <div className="bg-[#2a2a2a] rounded-xl p-4 mb-6">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Vista previa del menÃº</p>
        <div className="flex items-center gap-1 overflow-x-auto">
          {visibleCats.map(c => (
            <div key={c.id} className="group relative flex-shrink-0">
              <span className="px-3 py-2 text-[12px] text-gray-300 hover:text-white hover:bg-[#3a3a3a] rounded transition-colors cursor-default whitespace-nowrap">
                {c.icon && <span className="mr-1">{c.icon}</span>}{c.name}
              </span>
              {c.children.filter(s => s.showInMenu).length > 0 && (
                <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-[#333] rounded-lg shadow-xl py-1 z-10 min-w-[160px]">
                  {c.children.filter(s => s.showInMenu).map(s => (
                    <span key={s.id} className="block px-3 py-1.5 text-[11px] text-gray-400 hover:text-white hover:bg-[#444] transition-colors">{s.name}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {menuItems.filter(i => i.active).map(item => (
            <span key={item.id} className="px-3 py-2 text-[12px] text-gray-300 hover:text-white hover:bg-[#3a3a3a] rounded transition-colors cursor-default whitespace-nowrap flex-shrink-0">
              {item.icon && <span className="mr-1">{item.icon}</span>}{item.label}
            </span>
          ))}
          {visibleCats.length === 0 && menuItems.filter(i => i.active).length === 0 && (
            <span className="text-gray-500 text-xs italic">No hay elementos visibles en el menÃº</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setTab('categories')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'categories' ? 'bg-[#e8850c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          ðŸ“ CategorÃ­as ({categories.length})
        </button>
        <button onClick={() => setTab('placement')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'placement' ? 'bg-[#e8850c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Ubicación de categorías
        </button>
        <button onClick={() => setTab('custom')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'custom' ? 'bg-[#e8850c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          ðŸ”— Links personalizados ({menuItems.length})
        </button>
        <button onClick={() => setTab('footer')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'footer' ? 'bg-[#e8850c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          ðŸ”» Footer ({footerItems.length})
        </button>
      </div>

      {tab === 'placement' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800">Elegir categorías por menú</h2>
          <p className="text-sm text-gray-500 mt-1 mb-5">Estos dos selectores son independientes: uno controla la barra debajo del buscador y el otro el menú hamburguesa del celular.</p>
          {[
            { title: 'Menú debajo del buscador', value: menuCategories, set: setMenuCategories },
            { title: 'Menú hamburguesa', value: hamburgerCategories, set: setHamburgerCategories },
          ].map(group => (
            <div key={group.title} className="mb-6">
              <h3 className="font-semibold text-sm mb-2">{group.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map(category => (
                  <label key={`${group.title}-${category.id}`} className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm">
                    <input type="checkbox"
                      checked={group.value.includes(category.slug)}
                      onChange={event => group.set(event.target.checked
                        ? [...group.value, category.slug]
                        : group.value.filter(slug => slug !== category.slug))} />
                    {category.name}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Solo se mostrarán las categorías que marques y guardes.</p>
            </div>
          ))}
          <button onClick={saveCategories} disabled={saving} className="bg-[#e8850c] text-white px-5 py-2 rounded-lg text-sm font-semibold">
            {saving ? 'Guardando...' : 'Guardar ubicaciones'}
          </button>
        </div>
      )}

      {/* TAB: CategorÃ­as */}
      {tab === 'categories' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">Activa/desactiva categorÃ­as y reordÃ©nalas con las flechas</p>
            <button onClick={saveCategories} disabled={saving} className="bg-[#e8850c] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] disabled:opacity-50 transition-colors">
              {saving ? 'Guardando...' : 'ðŸ’¾ Guardar orden'}
            </button>
          </div>
          <div className="divide-y">
            {categories.map((cat, index) => (
              <div key={cat.id}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="flex gap-1">
                    <button onClick={() => moveCat(index, -1)} disabled={index === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-20 transition-colors"><ArrowUpIcon className="w-4 h-4 text-gray-500" /></button>
                    <button onClick={() => moveCat(index, 1)} disabled={index === categories.length - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-20 transition-colors"><ArrowDownIcon className="w-4 h-4 text-gray-500" /></button>
                  </div>
                  <button onClick={() => toggleCategoryMenu(cat.id)} className={`p-1.5 rounded-lg transition-colors ${cat.showInMenu ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {cat.showInMenu ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-800">{cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}</span>
                    <span className="text-xs text-gray-400 ml-2">/{cat.slug}</span>
                  </div>
                  <span className="text-xs text-gray-400">{cat._count.products} productos</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.showInMenu ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.showInMenu ? 'EN MENÃš' : 'OCULTA'}
                  </span>
                </div>
                {cat.children.length > 0 && cat.showInMenu && (
                  <div className="bg-gray-50/50 border-l-4 border-[#e8850c]/20 ml-12">
                    {cat.children.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100">
                        <button onClick={() => toggleSubMenu(cat.id, sub.id)} className={`p-1 rounded transition-colors ${sub.showInMenu ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {sub.showInMenu ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeSlashIcon className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-[13px] text-gray-600">â†³ {sub.name}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{sub.showInMenu ? 'En submenÃº' : 'Oculta'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {categories.length === 0 && <div className="py-12 text-center text-gray-400 text-sm">No hay categorÃ­as. Crea algunas en <a href="/admin/categorias" className="text-[#e8850c] underline">CategorÃ­as</a>.</div>}
          </div>
        </div>
      )}

      {/* TAB: Links personalizados (header) */}
      {tab === 'custom' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">Links personalizados que aparecen al final del menÃº de navegaciÃ³n</p>
            <button onClick={() => openNewItemForm('header')} className="bg-[#e8850c] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors flex items-center gap-1">
              <PlusIcon className="w-4 h-4" /> Nuevo link
            </button>
          </div>
          {showItemForm && formLocation === 'header' && <ItemForm />}
          <div className="divide-y">
            {menuItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <span className={`w-2 h-2 rounded-full ${item.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-800">{item.icon && <span className="mr-1">{item.icon}</span>}{item.label}</span>
                  <span className="text-xs text-gray-400 ml-2">{item.href}</span>
                  {item.openNew && <span className="text-[10px] text-blue-500 ml-2">â†— nueva pestaÃ±a</span>}
                </div>
                <button onClick={() => startEditItem(item)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors"><TrashIcon className="w-4 h-4" /></button>
              </div>
            ))}
            {menuItems.length === 0 && <div className="py-12 text-center text-gray-400 text-sm">No hay links personalizados. Agrega uno con el botÃ³n de arriba.</div>}
          </div>
        </div>
      )}

      {/* TAB: Footer */}
      {tab === 'footer' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Edita los links de cada columna del footer. Los cambios se reflejan en tiempo real en la tienda.</p>
          {FOOTER_SECTIONS.map(section => {
            const items = footerItems.filter(i => i.location === section.key);
            const isAdding = showItemForm && formLocation === section.key && !editingItem;
            const isEditing = showItemForm && editingItem && editingItem.location === section.key;
            return (
              <div key={section.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">Columna: {section.label}</h3>
                    <p className="text-xs text-gray-400">{items.length} links</p>
                  </div>
                  <button onClick={() => openNewItemForm(section.key)} className="bg-[#e8850c] text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] flex items-center gap-1">
                    <PlusIcon className="w-4 h-4" /> Agregar
                  </button>
                </div>
                {(isAdding || isEditing) && <ItemForm />}
                <div className="divide-y">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-800">{item.icon && <span className="mr-1">{item.icon}</span>}{item.label}</span>
                        <span className="text-xs text-gray-400 ml-2 truncate">{item.href}</span>
                        {item.openNew && <span className="text-[10px] text-blue-500 ml-2">â†—</span>}
                      </div>
                      <button onClick={() => startEditItem(item)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {items.length === 0 && <div className="py-6 text-center text-gray-400 text-sm">Sin links en esta columna</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
