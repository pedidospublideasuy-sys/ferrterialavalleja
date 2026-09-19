'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type ReportType = 'orders' | 'sales' | 'stock' | 'shipping';

interface ReportData {
  type: string;
  summary: Record<string, unknown>;
  data: Record<string, unknown>[];
  topProducts?: { name: string; qty: number; revenueUYU: number; revenueUSD: number; currency: string }[];
}

const reportTypes: { key: ReportType; label: string; icon: string; desc: string }[] = [
  { key: 'orders', label: 'Informe de Pedidos', icon: '🛒', desc: 'Resumen de todos los pedidos por estado y período' },
  { key: 'sales', label: 'Informe de Ventas', icon: '💰', desc: 'Análisis de ventas, ingresos y productos más vendidos' },
  { key: 'stock', label: 'Informe de Stock', icon: '📦', desc: 'Estado del inventario, productos bajo stock y valorización' },
  { key: 'shipping', label: 'Informe de Envíos', icon: '🚚', desc: 'Estado de envíos, tracking y entregas' },
];

export default function AdminInformes() {
  const [activeReport, setActiveReport] = useState<ReportType>('orders');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: activeReport });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const res = await fetch(`/api/admin/reports?${params}`);
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  const downloadCSV = () => {
    if (!report?.data?.length) { toast.error('No hay datos'); return; }
    const headers = Object.keys(report.data[0]);
    const rows = report.data.map(r => headers.map(h => {
      const val = r[h];
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val ?? '');
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `informe-${activeReport}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV descargado');
  };

  const downloadExcel = async () => {
    if (!report?.data?.length) { toast.error('No hay datos'); return; }
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(report.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Informe');
      XLSX.writeFile(wb, `informe-${activeReport}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel descargado');
    } catch {
      toast.error('Error al generar Excel');
    }
  };

  const downloadPDF = async () => {
    if (!report?.data?.length) { toast.error('No hay datos'); return; }
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text(`Informe de ${reportTypes.find(r => r.key === activeReport)?.label || activeReport}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-UY')}`, 14, 28);
      if (from || to) doc.text(`Período: ${from || 'Inicio'} a ${to || 'Hoy'}`, 14, 34);

      const headers = Object.keys(report.data[0]);
      const rows = report.data.map(r => headers.map(h => String(r[h] ?? '')));
      autoTable(doc, { head: [headers], body: rows, startY: 40, styles: { fontSize: 7 } });

      doc.save(`informe-${activeReport}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF descargado');
    } catch {
      toast.error('Error al generar PDF');
    }
  };

  const summary = report?.summary ? (report.summary as Record<string, string | number>) : undefined;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Informes</h1>
        <p className="text-sm text-gray-500 mt-1">Genera y descarga informes del sistema</p>
      </div>

      {/* Report type tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {reportTypes.map(r => (
          <button key={r.key} onClick={() => { setActiveReport(r.key); setReport(null); }}
            className={`text-left p-4 rounded-xl border-2 transition-all ${activeReport === r.key ? 'border-[#e8850c] bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <span className="text-2xl">{r.icon}</span>
            <div className="font-semibold text-sm mt-1">{r.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
          </button>
        ))}
      </div>

      {/* Date filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">
        {activeReport !== 'stock' && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Desde</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hasta</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </>
        )}
        <button onClick={fetchReport} disabled={loading}
          className="bg-[#e8850c] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] disabled:opacity-50">
          {loading ? 'Generando...' : 'Generar Informe'}
        </button>
      </div>

      {/* Results */}
      {report && (
        <div className="space-y-6">
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary).filter(([, val]) => typeof val !== 'object').map(([key, val]) => {
                const labels: Record<string, string> = {
                  total: 'Total', totalAmountUYU: 'Monto Total (UYU)', totalAmountUSD: 'Monto Total (USD)', totalOrders: 'Total Pedidos',
                  totalRevenueUYU: 'Ingresos (UYU)', totalRevenueUSD: 'Ingresos (USD)',
                  totalItems: 'Items Vendidos', totalProducts: 'Productos Totales', lowStock: 'Stock Bajo',
                  outOfStock: 'Sin Stock', totalStockValueUYU: 'Valor Inv. (UYU)', totalStockValueUSD: 'Valor Inv. (USD)',
                  totalProductsUYU: 'Modelos en UYU', totalProductsUSD: 'Modelos en USD',
                };
                const isAmount = key.toLowerCase().includes('amount') || key.toLowerCase().includes('revenue') || key.toLowerCase().includes('value');
                const currency = key.includes('UYU') ? 'UYU' : (key.includes('USD') ? 'USD' : '');
                
                return (
                  <div key={key} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#e8850c]">
                    <p className="text-xs text-gray-500">{labels[key] || key}</p>
                    <p className="text-xl font-bold mt-1">
                      {isAmount ? `${currency} ${Number(val).toFixed(2)}` : String(val)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top products for sales */}
          {report.topProducts && report.topProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-700 mb-3">Top Productos por Ingreso</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs uppercase border-b">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Producto</th>
                    <th className="pb-2 text-right">Cantidad</th>
                    <th className="pb-2 text-right">Ingreso</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProducts.map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="py-2 text-right">{p.qty}</td>
                      <td className="py-2 text-right font-bold">
                        {p.revenueUYU > 0 && <div>UYU {p.revenueUYU.toFixed(2)}</div>}
                        {p.revenueUSD > 0 && <div>USD {p.revenueUSD.toFixed(2)}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Status breakdown for orders */}
          {summary?.byStatus && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-700 mb-3">Desglose por Estado</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(summary.byStatus as unknown as Record<string, number>).map(([status, count]) => (
                  <div key={status} className="bg-gray-50 rounded-lg px-4 py-2 text-sm">
                    <span className="text-gray-500 capitalize">{status}: </span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data table */}
          {report.data.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Datos ({report.data.length} registros)</h3>
                <div className="flex gap-2">
                  <button onClick={downloadCSV} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700">
                    📄 CSV
                  </button>
                  <button onClick={downloadExcel} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700">
                    📊 Excel
                  </button>
                  <button onClick={downloadPDF} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700">
                    📕 PDF
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 bg-gray-50 text-xs uppercase tracking-wider">
                      {Object.keys(report.data[0]).map(h => (
                        <th key={h} className="p-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.slice(0, 100).map((row, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="p-3 whitespace-nowrap text-gray-600">
                            {val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val))
                              ? new Date(val as string).toLocaleDateString('es-UY')
                              : typeof val === 'number' ? val.toLocaleString('es-UY', { maximumFractionDigits: 2 })
                              : String(val ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {report.data.length > 100 && (
                <div className="p-3 text-center text-xs text-gray-400 bg-gray-50">
                  Mostrando primeros 100 de {report.data.length} registros. Descargue el informe completo para ver todos.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!report && !loading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p>Seleccione un tipo de informe y haga clic en &quot;Generar Informe&quot;</p>
        </div>
      )}
    </div>
  );
}
