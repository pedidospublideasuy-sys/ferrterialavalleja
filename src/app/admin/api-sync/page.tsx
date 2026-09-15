'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ApiSource {
  id: string;
  name: string;
  sourceType: string;
  baseUrl: string;
  apiKey: string | null;
  apiSecret: string | null;
  webhookSecret: string | null;
  active: boolean;
  lastSync: string | null;
  syncInterval: number;
  mapping: string | null;
}

interface SyncLog {
  id: string;
  apiSourceId: string;
  status: string;
  itemsSynced: number;
  itemsFailed: number;
  errors: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export default function AdminApiSync() {
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [webhookInfo, setWebhookInfo] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState('');
  const [form, setForm] = useState({
    name: '', sourceType: 'generic' as 'generic' | 'woocommerce',
    baseUrl: '', apiKey: '', apiSecret: '', webhookSecret: '', headers: '',
    active: true, syncInterval: 60, mapping: '',
  });

  const load = useCallback(async () => {
    try {
      const [srcRes, logRes, settingsRes] = await Promise.all([
        fetch('/api/admin/api-sources'),
        fetch('/api/admin/sync-logs'),
        fetch('/api/public/settings?keys=site_url'),
      ]);
      if (srcRes.ok) setSources(await srcRes.json());
      if (logRes.ok) setLogs(await logRes.json());
      // Detectar URL del sitio: 1) settings DB, 2) env var, 3) window HTTPS
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings.site_url) {
          setSiteUrl(settings.site_url.replace(/\/+$/, ''));
          setLoading(false);
          return;
        }
      }
    } catch { /* empty */ }
    // Fallback: usar NEXT_PUBLIC_SITE_URL o window.location si es HTTPS
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (envUrl) {
      setSiteUrl(envUrl.replace(/\/+$/, ''));
    } else if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin.startsWith('https://')) {
        setSiteUrl(origin);
      }
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.baseUrl) {
      toast.error('Nombre y URL son obligatorios');
      return;
    }
    if (form.sourceType === 'woocommerce' && (!form.apiKey || !form.apiSecret)) {
      toast.error('Consumer Key y Consumer Secret son obligatorios para WooCommerce');
      return;
    }

    try {
      const res = await fetch('/api/admin/api-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al crear');
      toast.success('API configurada correctamente');
      setShowForm(false);
      setTestResult(null);
      setForm({ name: '', sourceType: 'generic', baseUrl: '', apiKey: '', apiSecret: '', webhookSecret: '', headers: '', active: true, syncInterval: 60, mapping: '' });
      load();
    } catch {
      toast.error('Error al guardar');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/api-sources/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: form.sourceType,
          baseUrl: form.baseUrl,
          apiKey: form.apiKey,
          apiSecret: form.apiSecret,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: data.message });
        toast.success('Conexión exitosa');
      } else {
        setTestResult({ success: false, message: data.error || 'Error de conexión' });
        toast.error(data.error || 'Error de conexión');
      }
    } catch {
      setTestResult({ success: false, message: 'Error al conectar' });
      toast.error('Error al probar conexión');
    }
    setTesting(false);
  };

  const syncNow = async (sourceId: string) => {
    toast.loading('Sincronizando...', { id: 'sync' });
    try {
      let page = 1;
      let totalSynced = 0;
      let totalFailed = 0;
      let totalPages = 1;
      do {
        const res = await fetch(`/api/admin/api-sources/${sourceId}/sync?page=${page}`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error de sincronización');
        totalSynced += data.synced || 0;
        totalFailed += data.failed || 0;
        totalPages = data.totalPages || 1;
        page++;
      } while (page <= totalPages);
      toast.success(`Sincronización completada: ${totalSynced} productos sincronizados, ${totalFailed} fallidos`, { id: 'sync' });
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al sincronizar', { id: 'sync' });
    }
  };

  const deleteSource = async (sourceId: string) => {
    if (!confirm('¿Eliminar esta API? Los productos importados se mantendrán.')) return;
    try {
      const res = await fetch(`/api/admin/api-sources/${sourceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      toast.success('API eliminada');
      load();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30";

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">APIs Externas</h1>
          <p className="text-sm text-gray-500 mt-1">Importar y sincronizar productos desde APIs externas y WooCommerce</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-[#e8850c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors">
          + Nueva API
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-bold text-sm mb-4">Configurar Nueva API</h2>

          {/* Selector de tipo */}
          <div className="flex gap-3 mb-5">
            <button type="button"
              onClick={() => { setForm(f => ({ ...f, sourceType: 'generic', apiSecret: '' })); setTestResult(null); }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                form.sourceType === 'generic' ? 'border-[#e8850c] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="text-2xl mb-1">🔗</div>
              <div className="font-bold text-sm">API Genérica</div>
              <div className="text-xs text-gray-500 mt-1">Cualquier API REST con JSON</div>
            </button>
            <button type="button"
              onClick={() => { setForm(f => ({ ...f, sourceType: 'woocommerce' })); setTestResult(null); }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                form.sourceType === 'woocommerce' ? 'border-[#7f54b3] bg-purple-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="text-2xl mb-1">🛒</div>
              <div className="font-bold text-sm text-[#7f54b3]">WooCommerce</div>
              <div className="text-xs text-gray-500 mt-1">Tienda WordPress con WooCommerce</div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass}
                placeholder={form.sourceType === 'woocommerce' ? 'Mi Tienda WooCommerce' : 'Mi Proveedor API'} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {form.sourceType === 'woocommerce' ? 'URL de la Tienda *' : 'URL Base *'}
              </label>
              <input type="text" value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} className={inputClass}
                placeholder={form.sourceType === 'woocommerce' ? 'https://mitienda.com' : 'https://api.proveedor.com/v1/products'} />
              {form.sourceType === 'woocommerce' && (
                <p className="text-[10px] text-gray-400 mt-1">Solo la URL base de tu tienda (sin /wp-json/...)</p>
              )}
            </div>

            {form.sourceType === 'woocommerce' ? (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Consumer Key *</label>
                  <input type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} className={inputClass}
                    placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                  <p className="text-[10px] text-gray-400 mt-1">WooCommerce → Ajustes → Avanzado → REST API</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Consumer Secret *</label>
                  <input type="password" value={form.apiSecret} onChange={e => setForm(f => ({ ...f, apiSecret: e.target.value }))} className={inputClass}
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Webhook Secret (para sync automático)</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.webhookSecret} onChange={e => setForm(f => ({ ...f, webhookSecret: e.target.value }))} className={inputClass}
                      placeholder="Dejar vacío para generar uno automáticamente" />
                    <button type="button" onClick={() => {
                      const secret = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
                      setForm(f => ({ ...f, webhookSecret: secret }));
                    }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs whitespace-nowrap hover:bg-gray-200">
                      🔑 Generar
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Este secret se usa para verificar que los webhooks vienen de tu tienda WooCommerce</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">API Key</label>
                  <input type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Headers extra (JSON)</label>
                  <input type="text" value={form.headers} onChange={e => setForm(f => ({ ...f, headers: e.target.value }))} className={inputClass}
                    placeholder='{"X-Custom": "valor"}' />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">Intervalo sync (min)</label>
              <input type="number" value={form.syncInterval} onChange={e => setForm(f => ({ ...f, syncInterval: parseInt(e.target.value) || 60 }))} className={inputClass} />
            </div>

            {form.sourceType === 'generic' && (
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Mapeo de campos (JSON)</label>
                <textarea value={form.mapping} onChange={e => setForm(f => ({ ...f, mapping: e.target.value }))} className={inputClass} rows={4}
                  placeholder={'{\n  "name": "titulo",\n  "price": "precio",\n  "sku": "codigo",\n  "stock": "cantidad",\n  "description": "descripcion",\n  "images": "imagenes",\n  "id": "codigo"\n}'} />
              </div>
            )}

            {form.sourceType === 'woocommerce' && (
              <div className="md:col-span-2 bg-purple-50 rounded-lg p-4 border border-purple-100">
                <h3 className="font-semibold text-sm text-[#7f54b3] mb-2">ℹ️ Mapeo Automático WooCommerce</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                  <span>• <b>name</b> → Nombre del producto</span>
                  <span>• <b>regular_price</b> → Precio</span>
                  <span>• <b>sale_price</b> → Precio comparación</span>
                  <span>• <b>sku</b> → SKU</span>
                  <span>• <b>stock_quantity</b> → Stock</span>
                  <span>• <b>images</b> → Imágenes</span>
                  <span>• <b>description</b> → Descripción</span>
                  <span>• <b>categories</b> → Categoría</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">No necesitas configurar mapeo manual. Los campos se sincronizan automáticamente.</p>
              </div>
            )}

            {form.sourceType === 'woocommerce' && (
              <div className="md:col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-sm text-blue-700 mb-1">🔔 Webhooks (sync automático)</h3>
                <p className="text-xs text-blue-600">
                  Después de guardar esta API, se mostrará la <b>URL de entrega</b> (Delivery URL) y las instrucciones
                  para configurar los webhooks en WooCommerce. Esto permite que los productos se sincronicen automáticamente
                  cada vez que se creen, modifiquen o eliminen en tu tienda WooCommerce.
                </p>
              </div>
            )}

            {/* Test result */}
            {testResult && (
              <div className={`md:col-span-2 p-3 rounded-lg text-sm ${
                testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {testResult.success ? '✅' : '❌'} {testResult.message}
              </div>
            )}

            <div className="md:col-span-2 flex gap-2">
              <button type="button" onClick={testConnection} disabled={testing || !form.baseUrl}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  form.sourceType === 'woocommerce'
                    ? 'bg-[#7f54b3] text-white hover:bg-[#6b4597] disabled:opacity-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                }`}>
                {testing ? '⏳ Probando...' : '🔌 Probar Conexión'}
              </button>
              <button type="submit" className="bg-[#e8850c] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b]">
                💾 Guardar API
              </button>
              <button type="button" onClick={() => { setShowForm(false); setTestResult(null); }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* APIs configuradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {sources.map(src => (
          <div key={src.id} className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
            src.sourceType === 'woocommerce' ? 'border-l-[#7f54b3]' : 'border-l-[#e8850c]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${src.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span className="text-lg">{src.sourceType === 'woocommerce' ? '🛒' : '🔗'}</span>
                <h3 className="font-bold">{src.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  src.sourceType === 'woocommerce'
                    ? 'bg-purple-100 text-[#7f54b3]'
                    : 'bg-orange-100 text-[#e8850c]'
                }`}>
                  {src.sourceType === 'woocommerce' ? 'WooCommerce' : 'API'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 truncate mb-3">{src.baseUrl}</p>
            <div className="flex gap-4 text-xs text-gray-500 mb-4">
              <span>Intervalo: {src.syncInterval} min</span>
              <span>Última sync: {src.lastSync ? new Date(src.lastSync).toLocaleString('es-UY') : 'Nunca'}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => syncNow(src.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white ${
                  src.sourceType === 'woocommerce'
                    ? 'bg-[#7f54b3] hover:bg-[#6b4597]'
                    : 'bg-[#1a8a7d] hover:bg-[#158070]'
                }`}>
                🔄 Sincronizar ahora
              </button>
              {src.sourceType === 'woocommerce' && (
                <button onClick={() => setWebhookInfo(webhookInfo === src.id ? null : src.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    webhookInfo === src.id 
                      ? 'bg-[#7f54b3] text-white' 
                      : 'bg-purple-50 text-[#7f54b3] hover:bg-purple-100'
                  }`}>
                  🔔 {webhookInfo === src.id ? 'Ocultar Webhooks' : 'Ver URL de Webhook'}
                </button>
              )}
              <button onClick={() => deleteSource(src.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100">
                🗑 Eliminar
              </button>
            </div>

            {/* Webhook URL siempre visible para WooCommerce */}
            {src.sourceType === 'woocommerce' && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">📌 URL de Entrega (Delivery URL) para Webhooks</label>
                {!siteUrl ? (
                  <div>
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded mb-2 text-[11px] text-yellow-700">
                      ⚠️ Ingresá la URL pública (HTTPS) de tu sitio para generar la URL del webhook. Ejemplo: <b>https://tu-dominio.com</b>
                    </div>
                    <div className="flex gap-1">
                      <input type="text" 
                        placeholder="https://tu-dominio.com"
                        className="flex-1 bg-white border border-gray-300 rounded px-2 py-1.5 text-xs font-mono text-gray-700"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.replace(/\/+$/, '');
                            if (val.startsWith('https://')) {
                              setSiteUrl(val);
                              // Guardar en settings para la próxima vez
                              fetch('/api/admin/settings', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ site_url: val }),
                              });
                              toast.success('URL del sitio guardada');
                            } else {
                              toast.error('La URL debe empezar con https://');
                            }
                          }
                        }}
                      />
                      <button onClick={() => {
                        const input = document.querySelector<HTMLInputElement>('[placeholder="https://tu-dominio.com"]');
                        if (input) {
                          const val = input.value.replace(/\/+$/, '');
                          if (val.startsWith('https://')) {
                            setSiteUrl(val);
                            fetch('/api/admin/settings', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ site_url: val }),
                            });
                            toast.success('URL del sitio guardada');
                          } else {
                            toast.error('La URL debe empezar con https://');
                          }
                        }
                      }}
                        className="px-3 py-1.5 bg-[#7f54b3] text-white rounded text-xs hover:bg-[#6b4597] font-medium">✓ Guardar</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-1">
                      <input readOnly value={`${siteUrl}/api/webhooks/woocommerce/${src.id}`}
                        className="flex-1 bg-white border border-gray-300 rounded px-2 py-1.5 text-xs font-mono text-gray-700" />
                      <button onClick={() => {
                        navigator.clipboard.writeText(`${siteUrl}/api/webhooks/woocommerce/${src.id}`);
                        toast.success('URL copiada al portapapeles');
                      }}
                        className="px-3 py-1.5 bg-[#7f54b3] text-white rounded text-xs hover:bg-[#6b4597] font-medium">📋 Copiar</button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[10px] text-gray-400">Base: {siteUrl}</p>
                      <button onClick={() => setSiteUrl('')} className="text-[10px] text-blue-500 hover:underline">Cambiar URL</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Panel de configuración de Webhooks */}
            {webhookInfo === src.id && src.sourceType === 'woocommerce' && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <h4 className="font-bold text-sm text-[#7f54b3] mb-3">🔔 Configuración de Webhooks</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Configura estos webhooks en tu WooCommerce para sincronizar productos automáticamente cuando se creen, actualicen o eliminen.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">URL del Webhook (Delivery URL)</label>
                    <div className="flex gap-1">
                      <input readOnly value={siteUrl ? `${siteUrl}/api/webhooks/woocommerce/${src.id}` : 'Configurá la URL del sitio arriba ↑'}
                        className="flex-1 bg-white border border-purple-200 rounded px-2 py-1.5 text-xs font-mono text-gray-700" />
                      <button onClick={() => {
                        if (siteUrl) {
                          navigator.clipboard.writeText(`${siteUrl}/api/webhooks/woocommerce/${src.id}`);
                          toast.success('URL copiada');
                        } else {
                          toast.error('Primero configurá la URL del sitio');
                        }
                      }}
                        className="px-2 py-1.5 bg-white border border-purple-200 rounded text-xs hover:bg-purple-50">📋</button>
                    </div>
                  </div>

                  {src.webhookSecret && (
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">Secret</label>
                      <div className="flex gap-1">
                        <input readOnly value={src.webhookSecret}
                          className="flex-1 bg-white border border-purple-200 rounded px-2 py-1.5 text-xs font-mono text-gray-700" />
                        <button onClick={() => {
                          navigator.clipboard.writeText(src.webhookSecret!);
                          toast.success('Secret copiado');
                        }}
                          className="px-2 py-1.5 bg-white border border-purple-200 rounded text-xs hover:bg-purple-50">📋</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-white rounded border border-purple-100">
                  <h5 className="font-semibold text-xs text-gray-700 mb-2">📝 Pasos en WooCommerce:</h5>
                  <ol className="text-[11px] text-gray-600 space-y-1.5 list-decimal pl-4">
                    <li>Ir a <b>WooCommerce → Ajustes → Avanzado → Webhooks</b></li>
                    <li>Click <b>&quot;Agregar webhook&quot;</b></li>
                    <li>Nombre: <b>Sync productos</b> (o lo que quieras)</li>
                    <li>Estado: <b>Activo</b></li>
                    <li>Tema: <b>Producto creado</b> — pegar la URL de arriba</li>
                    {src.webhookSecret && <li>Secret: pegar el secret de arriba</li>}
                    <li>Versión API: <b>WP REST API Integration v3</b></li>
                    <li>Click <b>Guardar webhook</b></li>
                    <li>Repetir para: <b>Producto actualizado</b> y <b>Producto eliminado</b></li>
                  </ol>
                </div>

                <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200 text-[10px] text-yellow-700">
                  💡 <b>Tip:</b> Necesitas crear 3 webhooks (uno por cada evento: creado, actualizado, eliminado). Los 3 usan la misma URL y secret.
                </div>
              </div>
            )}
          </div>
        ))}
        {sources.length === 0 && (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">🔗</p>
            <p className="font-medium text-gray-600">No hay APIs configuradas</p>
            <p className="text-xs mt-1">Agrega una API externa o conecta tu tienda WooCommerce para importar productos automáticamente</p>
          </div>
        )}
      </div>

      {/* Logs de sincronización */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-lg mb-4">Historial de Sincronización</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b text-xs uppercase">
                <th className="pb-3">Fecha</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3 text-center">Sincronizados</th>
                <th className="pb-3 text-center">Fallidos</th>
                <th className="pb-3">Duración</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="py-3 text-gray-500">{new Date(log.startedAt).toLocaleString('es-UY')}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === 'success' ? 'bg-green-100 text-green-700' :
                      log.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{log.status}</span>
                  </td>
                  <td className="py-3 text-center font-medium">{log.itemsSynced}</td>
                  <td className="py-3 text-center text-red-500">{log.itemsFailed}</td>
                  <td className="py-3 text-gray-500">
                    {log.finishedAt ? `${Math.round((new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s` : 'En curso...'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
