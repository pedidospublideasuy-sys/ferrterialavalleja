'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Page {
  id: string
  slug: string
  title: string
  published: boolean
  showInFooter: boolean
  createdAt: string
  updatedAt: string
}

interface PageForm {
  id?: string
  slug: string
  title: string
  content: string
  metaTitle: string
  metaDesc: string
  published: boolean
  showInFooter: boolean
}

const emptyForm: PageForm = {
  slug: '',
  title: '',
  content: '',
  metaTitle: '',
  metaDesc: '',
  published: true,
  showInFooter: false,
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function AdminPaginasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [form, setForm] = useState<PageForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'contenido' | 'seo'>('contenido')

  // Product search / insert
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState<{ id: string; name: string; slug: string; sku: string }[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/')
  }, [status, session, router])

  useEffect(() => {
    fetchPages()
  }, [])

  async function fetchPages() {
    setLoading(true)
    const res = await fetch('/api/admin/pages')
    if (res.ok) setPages(await res.json())
    setLoading(false)
  }

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProductResults([]); return }
    setSearchingProducts(true)
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=8`)
      if (res.ok) {
        const data = await res.json()
        setProductResults((data.products ?? data).slice(0, 8))
      }
    } finally {
      setSearchingProducts(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productQuery), 300)
    return () => clearTimeout(t)
  }, [productQuery, searchProducts])

  function insertShortcode(slug: string) {
    const shortcode = `[producto slug="${slug}"]`
    const ta = textareaRef.current
    if (ta) {
      const start = ta.selectionStart ?? form.content.length
      const end = ta.selectionEnd ?? start
      const before = form.content.slice(0, start)
      const after = form.content.slice(end)
      const newContent = before + shortcode + after
      setForm(f => ({ ...f, content: newContent }))
      // Restore focus + cursor after React re-renders
      setTimeout(() => {
        ta.focus()
        const pos = start + shortcode.length
        ta.setSelectionRange(pos, pos)
      }, 0)
    } else {
      setForm(f => ({ ...f, content: f.content + shortcode }))
    }
    setShowProductSearch(false)
    setProductQuery('')
    setProductResults([])
  }

  function openNew() {
    setForm(emptyForm)
    setActiveTab('contenido')
    setView('editor')
  }

  async function openEdit(page: Page) {
    // Cargar contenido completo
    const res = await fetch(`/api/pages/${page.slug}`)
    if (res.ok) {
      const data = await res.json()
      setForm({
        id: data.id,
        slug: data.slug,
        title: data.title,
        content: data.content || '',
        metaTitle: data.metaTitle || '',
        metaDesc: data.metaDesc || '',
        published: data.published,
        showInFooter: page.showInFooter,
      })
    } else {
      setForm({
        id: page.id,
        slug: page.slug,
        title: page.title,
        content: '',
        metaTitle: '',
        metaDesc: '',
        published: page.published,
        showInFooter: page.showInFooter,
      })
    }
    setActiveTab('contenido')
    setView('editor')
  }

  function handleTitleChange(val: string) {
    setForm(f => ({
      ...f,
      title: val,
      // Solo auto-slugificar si es nueva página
      slug: !f.id ? slugify(val) : f.slug,
    }))
  }

  async function savePage() {
    if (!form.title.trim() || !form.slug.trim()) {
      showToast('El título y el slug son requeridos', 'err')
      return
    }

    setSaving(true)
    const method = form.id ? 'PUT' : 'POST'
    const res = await fetch('/api/admin/pages', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      showToast(data.error || 'Error al guardar', 'err')
      return
    }

    showToast(form.id ? 'Página actualizada' : 'Página creada')
    setView('list')
    fetchPages()
  }

  async function toggleField(page: Page, field: 'published' | 'showInFooter') {
    const res = await fetch('/api/admin/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: page.id, [field]: !page[field] }),
    })
    if (res.ok) {
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, [field]: !p[field] } : p))
    }
  }

  async function deletePage(id: string) {
    const res = await fetch(`/api/admin/pages?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Página eliminada')
      setPages(prev => prev.filter(p => p.id !== id))
    } else {
      showToast('Error al eliminar', 'err')
    }
    setDeleteId(null)
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar página?</h3>
            <p className="text-gray-600 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => deletePage(deleteId)}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Páginas de contenido</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestiona las páginas informativas del sitio (contacto, términos, etc.)
              </p>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <span className="text-lg leading-none">+</span>
              Nueva página
            </button>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                Cargando páginas...
              </div>
            ) : pages.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📄</p>
                <p className="font-medium text-gray-600">No hay páginas creadas</p>
                <p className="text-sm mt-1">Crea tu primera página con el botón de arriba</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Título</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Slug / URL</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Publicada</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">En Footer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Modificada</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pages.map(page => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{page.title}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`/p/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-mono text-xs"
                        >
                          /p/{page.slug}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleField(page, 'published')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            page.published
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {page.published ? '✓ Sí' : '✗ No'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleField(page, 'showInFooter')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            page.showInFooter
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {page.showInFooter ? '✓ Sí' : '✗ No'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(page.updatedAt).toLocaleDateString('es-UY', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(page)}
                            className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleteId(page.id)}
                            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">ℹ️ Cómo funcionan las páginas</p>
            <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
              <li>Las páginas publicadas son accesibles en <span className="font-mono">/p/[slug]</span></li>
              <li>Las páginas marcadas &quot;En Footer&quot; aparecen como links en el pie del sitio</li>
              <li>Puedes usar HTML en el contenido para formatear el texto</li>
            </ul>
          </div>
        </>
      ) : (
        /* EDITOR */
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('list')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                {form.id ? `Editando: ${form.title}` : 'Nueva página'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {form.id && (
                <a
                  href={`/p/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver página ↗
                </a>
              )}
              <button
                onClick={savePage}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium"
              >
                {saving ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel izquierdo - Contenido principal */}
            <div className="lg:col-span-2 space-y-4">
              {/* Tabs */}
              <div className="flex gap-1 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('contenido')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    activeTab === 'contenido'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Contenido
                </button>
                <button
                  onClick={() => setActiveTab('seo')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    activeTab === 'seo'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  SEO
                </button>
              </div>

              {activeTab === 'contenido' && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título de la página *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => handleTitleChange(e.target.value)}
                      placeholder="Ej: Términos y Condiciones"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenido (HTML)
                    </label>

                    {/* Toolbar de inserción */}
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => { setShowProductSearch(v => !v); setProductQuery(''); setProductResults([]) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-50 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 font-medium"
                      >
                        📦 Insertar producto
                      </button>
                    </div>

                    {/* Panel búsqueda de producto */}
                    {showProductSearch && (
                      <div className="mb-2 border border-orange-200 rounded-lg bg-orange-50 p-3 space-y-2">
                        <p className="text-xs text-orange-700 font-medium">Buscar producto para insertar como shortcode:</p>
                        <input
                          type="text"
                          autoFocus
                          value={productQuery}
                          onChange={e => setProductQuery(e.target.value)}
                          placeholder="Nombre, SKU o slug del producto..."
                          className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                        />
                        {searchingProducts && (
                          <p className="text-xs text-orange-500">Buscando...</p>
                        )}
                        {!searchingProducts && productQuery && productResults.length === 0 && (
                          <p className="text-xs text-orange-500">No se encontraron productos.</p>
                        )}
                        {productResults.length > 0 && (
                          <ul className="divide-y divide-orange-100 border border-orange-200 rounded-lg bg-white overflow-hidden">
                            {productResults.map(p => (
                              <li key={p.id}>
                                <button
                                  type="button"
                                  onClick={() => insertShortcode(p.slug)}
                                  className="w-full text-left px-3 py-2 hover:bg-orange-50 flex items-center justify-between gap-3"
                                >
                                  <span className="text-sm font-medium text-gray-800 truncate">{p.name}</span>
                                  <span className="text-xs text-gray-400 shrink-0 font-mono">{p.sku}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {!productQuery && (
                          <p className="text-xs text-orange-600 italic">Escribe para buscar un producto...</p>
                        )}
                      </div>
                    )}

                    <textarea
                      ref={textareaRef}
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      rows={22}
                      placeholder={`<h2>Título de sección</h2>\n<p>Contenido del párrafo...</p>\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>`}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Puedes usar etiquetas HTML: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;strong&gt;, &lt;a href=&quot;...&quot;&gt;, &lt;br&gt;, etc.
                      También shortcodes: <span className="font-mono">[producto slug=&quot;mi-producto&quot;]</span> · <span className="font-mono">[productos categoria=&quot;notebooks&quot; limit=&quot;4&quot;]</span>
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta título
                    </label>
                    <input
                      type="text"
                      value={form.metaTitle}
                      onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                      placeholder={form.title || 'Título para motores de búsqueda'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Si se deja vacío, se usa el título de la página. Máximo 60 caracteres recomendado.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta descripción
                    </label>
                    <textarea
                      value={form.metaDesc}
                      onChange={e => setForm(f => ({ ...f, metaDesc: e.target.value }))}
                      rows={3}
                      placeholder="Descripción breve para motores de búsqueda (160 caracteres recomendado)"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {form.metaDesc.length}/160 caracteres
                    </p>
                  </div>

                  {/* Preview SEO */}
                  {(form.title || form.metaDesc) && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Vista previa en Google</p>
                      <div className="space-y-0.5">
                        <p className="text-green-700 text-xs">ferreterialavalleja.com/p/{form.slug}</p>
                        <p className="text-blue-700 text-base font-medium leading-snug">
                          {form.metaTitle || form.title || 'Título de la página'}
                        </p>
                        <p className="text-gray-600 text-xs leading-relaxed">
                          {form.metaDesc || 'Sin descripción configurada.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel derecho - Configuración */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="font-semibold text-gray-800 text-sm">Configuración</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL) *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 shrink-0">/p/</span>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      placeholder="mi-pagina"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Solo letras minúsculas, números y guiones</p>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Publicada</p>
                    <p className="text-xs text-gray-400">Visible para los visitantes</p>
                  </div>
                  <button
                    onClick={() => setForm(f => ({ ...f, published: !f.published }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.published ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                        form.published ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Mostrar en Footer</p>
                    <p className="text-xs text-gray-400">Aparece en el pie del sitio</p>
                  </div>
                  <button
                    onClick={() => setForm(f => ({ ...f, showInFooter: !f.showInFooter }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.showInFooter ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                        form.showInFooter ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Ayuda HTML */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800">
                <p className="font-semibold mb-2">📝 Etiquetas HTML útiles</p>
                <div className="space-y-1 font-mono text-yellow-700">
                  <p>&lt;h2&gt;Título&lt;/h2&gt;</p>
                  <p>&lt;h3&gt;Subtítulo&lt;/h3&gt;</p>
                  <p>&lt;p&gt;Párrafo&lt;/p&gt;</p>
                  <p>&lt;strong&gt;Negrita&lt;/strong&gt;</p>
                  <p>&lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt;</p>
                  <p>&lt;a href=&quot;/&quot;&gt;Link&lt;/a&gt;</p>
                  <p>&lt;br&gt; (salto de línea)</p>
                  <p>&lt;hr&gt; (línea divisoria)</p>
                </div>
              </div>

              {/* Ayuda shortcodes */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800">
                <p className="font-semibold mb-2">📦 Shortcodes de productos</p>
                <div className="space-y-1.5 font-mono text-orange-700">
                  <p>[producto slug=&quot;mi-producto&quot;]</p>
                  <p className="text-orange-500 not-italic font-sans">— Un producto por slug</p>
                  <p>[productos categoria=&quot;notebooks&quot; limit=&quot;4&quot;]</p>
                  <p className="text-orange-500 not-italic font-sans">— Lista por categoría</p>
                  <p>[productos marca=&quot;logitech&quot; limit=&quot;8&quot;]</p>
                  <p className="text-orange-500 not-italic font-sans">— Lista por marca</p>
                  <p>[productos destacados=&quot;true&quot; limit=&quot;4&quot;]</p>
                  <p className="text-orange-500 not-italic font-sans">— Productos destacados</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
