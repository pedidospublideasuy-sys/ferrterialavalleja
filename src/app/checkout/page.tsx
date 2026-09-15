'use client';

import { useCart } from '@/store/cart';
import { useCurrency } from '@/store/currency';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface PaymentMethod {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  desc: string;
}

const DEFAULT_METHODS: PaymentMethod[] = [
  { id: 'transferencia', label: 'Transferencia Bancaria', icon: '🏦', enabled: true, desc: 'Transferí a cualquiera de nuestras cuentas bancarias' },
  { id: 'mercadopago', label: 'MercadoPago', icon: '💙', enabled: true, desc: 'Pagá con tarjeta, débito o saldo MercadoPago' },
  { id: 'contado', label: 'Contado en local', icon: '💵', enabled: true, desc: 'Pagá en efectivo al retirar en nuestro local' },
];

export default function CheckoutPage() {
  const formatCurrency = useCurrency((s) => s.format);
  const convert = useCurrency((s) => s.convert);
  const displayCurrency = useCurrency((s) => s.currency);
  const { data: session } = useSession();
  const { items, clearCart } = useCart();
  const convertedTotal = items.reduce((sum, item) => sum + convert(item.product.price, item.product.currency || 'UYU') * item.quantity, 0);
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(DEFAULT_METHODS);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', notes: '', paymentMethod: 'transferencia'
  });

  useEffect(() => {
    fetch('/api/admin/payment-methods')
      .then(r => r.json())
      .then(d => {
        const enabled = (d.methods as PaymentMethod[]).filter(m => m.enabled);
        if (enabled.length > 0) {
          setPaymentMethods(enabled);
          setForm(prev => ({ ...prev, paymentMethod: enabled[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  // Pre-fill form from logged-in user's profile + default address
  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch('/api/user/profile').then(r => r.ok ? r.json() : null),
      fetch('/api/user/addresses').then(r => r.ok ? r.json() : []),
    ]).then(([profile, addresses]) => {
      const defaultAddr = Array.isArray(addresses)
        ? (addresses.find((a: { isDefault: boolean }) => a.isDefault) ?? addresses[0])
        : null;
      setForm(prev => ({
        ...prev,
        name: profile?.name || prev.name,
        email: session.user?.email || prev.email,
        phone: profile?.phone || prev.phone,
        address: defaultAddr?.address || profile?.address || prev.address,
        city: defaultAddr?.city || profile?.city || prev.city,
      }));
    }).catch(() => {});
  }, [session]);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">No hay productos en el carrito</h1>
        <Link href="/productos" className="text-blue-600 hover:underline">Ir a comprar</Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Inicia sesion para continuar</h1>
        <Link href="/auth/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
          Iniciar Sesion
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.product.id, quantity: i.quantity, price: i.product.price })),
          ...form,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        clearCart();
        toast.success('Pedido #' + data.orderNumber + ' creado!');
        window.location.href = '/mi-cuenta';
      }
    } catch {
      toast.error('Error al procesar el pedido');
    }
    setLoading(false);
  };

  const update = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [f]: e.target.value });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Finalizar Compra</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-bold text-lg mb-4">Datos de Envio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input type="text" required value={form.name} onChange={update('name')}
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" required value={form.email} onChange={update('email')}
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <input type="tel" value={form.phone} onChange={update('phone')}
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input type="text" value={form.city} onChange={update('city')}
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                <input type="text" required value={form.address} onChange={update('address')}
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={form.notes} onChange={update('notes')} rows={2}
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-bold text-lg mb-4">Método de Pago</h2>
              <div className="space-y-3">
                {paymentMethods.map((opt) => (
                  <label key={opt.id} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${form.paymentMethod === opt.id ? 'border-[#e8850c] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value={opt.id}
                      checked={form.paymentMethod === opt.id} onChange={update('paymentMethod')}
                      className="mt-1" />
                    <div>
                      <span className="font-semibold text-gray-800">{opt.icon} {opt.label}</span>
                      {opt.desc && <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl border p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4">Resumen del Pedido</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.product.name} x{item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.product.price * item.quantity, item.product.currency || 'UYU')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(convertedTotal, displayCurrency)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Envio</span><span className="text-green-600">A confirmar</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span><span className="text-blue-900">{formatCurrency(convertedTotal, displayCurrency)}</span>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
