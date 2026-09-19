'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  totalUYU: number;
  totalUSD: number;
  notes: string | null;
  internalNotes: string | null;
  shippingAddr: string | null;
  shippingCity: string | null;
  shippingPhone: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; phone: string | null };
  items: {
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    subtotal: number;
    currency: string;
    product: { id: string; images: string };
    variant: {
      id: string;
      name: string;
      sku: string;
    } | null;
  }[];
  payments: {
    id: string;
    method: string;
    status: string;
    amount: number;
    currency: string;
    externalId: string | null;
    paidAt: string | null;
  }[];
  returns: { id: string; reason: string; status: string; refundAmount: number | null; createdAt: string }[];
}

const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'refunded', label: 'Reembolsado' },
];

const paymentStatusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'failed', label: 'Fallido' },
  { value: 'refunded', label: 'Reembolsado' },
];

export default function OrderDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [tracking, setTracking] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [orderId, setOrderId] = useState('');

  const load = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/orders/${id}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data);
      setNotes(data.internalNotes || '');
      setTracking(data.trackingNumber || '');
      setTrackingUrl(data.trackingUrl || '');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    paramsPromise.then(p => {
      setOrderId(p.id);
      load(p.id);
    });
  }, [paramsPromise, load]);

  const updateField = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      toast.success('Pedido actualizado');
      load(orderId);
    } catch {
      toast.error('Error al actualizar');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#e8850c] border-t-transparent rounded-full"></div></div>;
  if (!order) return <div className="text-center py-20 text-gray-400">Pedido no encontrado</div>;

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/pedidos" className="text-sm text-gray-500 hover:text-gray-700">← Volver a pedidos</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">Pedido {order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('es-UY')}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor[order.status] || 'bg-gray-100'}`}>
          {statusOptions.find(s => s.value === order.status)?.label || order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="xl:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Productos</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3">Producto</th>
                  <th className="pb-3 text-right">Precio</th>
                  <th className="pb-3 text-center">Cant.</th>
                  <th className="pb-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => {
                  const imgs = JSON.parse(item.product.images || '[]') as string[];
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {imgs[0] ? <img src={imgs[0]} alt="" className="w-full h-full object-cover" /> : null}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right">{item.currency || 'UYU'} {item.price.toFixed(2)}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right font-medium">{item.currency || 'UYU'} {item.subtotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 pt-4 border-t space-y-1 text-sm text-right">
              {order.totalUYU === 0 && order.totalUSD === 0 && (
                <>
                  <div className="flex justify-end gap-8"><span className="text-gray-500">Subtotal:</span><span>UYU {order.subtotal.toFixed(2)}</span></div>
                  {order.shipping > 0 && <div className="flex justify-end gap-8"><span className="text-gray-500">Envío:</span><span>UYU {order.shipping.toFixed(2)}</span></div>}
                  {order.discount > 0 && <div className="flex justify-end gap-8"><span className="text-gray-500">Descuento:</span><span className="text-green-600">-UYU {order.discount.toFixed(2)}</span></div>}
                  {order.tax > 0 && <div className="flex justify-end gap-8"><span className="text-gray-500">Impuestos:</span><span>UYU {order.tax.toFixed(2)}</span></div>}
                  <div className="flex justify-end gap-8 text-lg font-bold pt-2"><span>Total:</span><span>UYU {order.total.toFixed(2)}</span></div>
                </>
              )}
              {order.totalUYU > 0 && (
                <div className="flex justify-end gap-8 text-lg font-bold pt-2 border-t mt-2"><span>Total (UYU):</span><span>UYU {order.totalUYU.toFixed(2)}</span></div>
              )}
              {order.totalUSD > 0 && (
                <div className="flex justify-end gap-8 text-lg font-bold pt-2 border-t mt-2 text-green-700"><span>Total (USD):</span><span>USD {order.totalUSD.toFixed(2)}</span></div>
              )}
            </div>
          </div>

          {/* Pagos */}
          {order.payments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Pagos</h2>
              {order.payments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium">{p.method}</span>
                    {p.externalId && <span className="text-xs text-gray-400 ml-2">ID: {p.externalId}</span>}
                  </div>
                    <div className="text-right">
                      <span className="font-medium">{p.currency || 'UYU'} {p.amount.toFixed(2)}</span>
                      <span className={`ml-2 text-xs ${p.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>{p.status}</span>
                    </div>
                </div>
              ))}
            </div>
          )}

          {/* Notas internas */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Notas Internas</h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30"
              placeholder="Notas visibles solo para administradores..." />
            <button onClick={() => updateField({ internalNotes: notes })}
              className="mt-2 bg-gray-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-700">
              Guardar nota
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cambiar estado */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Estado del Pedido</h2>
            <select value={order.status} onChange={e => updateField({ status: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30 mb-3">
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            <h3 className="font-bold text-xs text-gray-600 mb-2 mt-4">Estado de Pago</h3>
            <select value={order.paymentStatus} onChange={e => updateField({ paymentStatus: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30">
              {paymentStatusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Cliente */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Cliente</h2>
            <p className="font-medium">{order.user.name}</p>
            <p className="text-sm text-gray-500">{order.user.email}</p>
            {order.user.phone && <p className="text-sm text-gray-500">{order.user.phone}</p>}
          </div>

          {/* Envío */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Envío</h2>
            {order.shippingAddr && <p className="text-sm">{order.shippingAddr}</p>}
            {order.shippingCity && <p className="text-sm text-gray-500">{order.shippingCity}</p>}
            {order.shippingPhone && <p className="text-sm text-gray-500">Tel: {order.shippingPhone}</p>}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nro. Seguimiento</label>
                <input type="text" value={tracking} onChange={e => setTracking(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="TRACK-123456" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">URL Seguimiento</label>
                <input type="text" value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
              </div>
              <button onClick={() => updateField({ trackingNumber: tracking, trackingUrl })}
                className="w-full bg-gray-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-700">
                Guardar envío
              </button>
            </div>
          </div>

          {/* Notas del cliente */}
          {order.notes && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wider">Notas del Cliente</h2>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
