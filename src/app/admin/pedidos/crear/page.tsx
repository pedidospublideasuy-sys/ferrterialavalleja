'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface User { id: string; name: string; email: string }
interface Product { id: string; name: string; price: number; stock: number; sku: string; currency?: string; }
interface CartLine { productId: string; name: string; price: number; quantity: number; maxStock: number; currency: string; }

export default function CrearPedidoPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [lines, setLines] = useState<CartLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [shipping, setShipping] = useState({ addr: '', city: '', phone: '' });
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users?limit=500').then(r => r.json()).then(d => setUsers(d.users || []));
    fetch('/api/admin/products?limit=500').then(r => r.json()).then(d => setProducts(d.products || []));
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 10);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const addProduct = (p: Product) => {
    if (lines.find(l => l.productId === p.id)) {
      setLines(lines.map(l => l.productId === p.id ? { ...l, quantity: Math.min(l.quantity + 1, l.maxStock) } : l));
    } else {
      setLines([...lines, { productId: p.id, name: p.name, price: p.price, quantity: 1, maxStock: p.stock, currency: p.currency || 'UYU' }]);
    }
    setProductSearch('');
  };

  const updateQty = (idx: number, qty: number) => {
    const next = [...lines];
    next[idx].quantity = Math.max(1, Math.min(qty, next[idx].maxStock));
    setLines(next);
  };

  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  const subtotalUYU = lines.filter(l => l.currency !== 'USD').reduce((acc, l) => acc + (l.price * l.quantity), 0);
  const subtotalUSD = lines.filter(l => l.currency === 'USD').reduce((acc, l) => acc + (l.price * l.quantity), 0);

  const handleCreate = async () => {
    if (!selectedUser) { toast.error('Seleccione un cliente'); return; }
    if (!lines.length) { toast.error('Agregue al menos un producto'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selectedUser,
        items: lines.map(l => ({ productId: l.productId, quantity: l.quantity })),
        shippingAddr: shipping.addr,
        shippingCity: shipping.city,
        shippingPhone: shipping.phone,
        notes,
        paymentMethod,
      }),
    });
    const data = await res.json();
    if (data.order) {
      toast.success(`Pedido ${data.order.orderNumber} creado`);
      router.push(`/admin/pedidos/${data.order.id}`);
    } else {
      toast.error(data.error || 'Error al crear pedido');
    }
    setSaving(false);
  };

  const selectedUserObj = users.find(u => u.id === selectedUser);

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/pedidos" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">← Volver a Pedidos</Link>
        <h1 className="text-2xl font-bold text-gray-800">Crear Pedido</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Productos</h3>
            <div className="relative mb-4">
              <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                placeholder="Buscar producto por nombre o SKU..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" />
              {productSearch && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => addProduct(p)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex justify-between items-center">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.sku || 'Sin SKU'} · Stock: {p.stock}</div>
                      </div>
                      <span className="font-bold text-gray-700">{p.currency || 'UYU'} {p.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {lines.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs uppercase border-b">
                    <th className="pb-2">Producto</th>
                    <th className="pb-2 text-right">Precio</th>
                    <th className="pb-2 text-center">Cantidad</th>
                    <th className="pb-2 text-right">Subtotal</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={l.productId} className="border-t">
                      <td className="py-3 font-medium">{l.name}</td>
                      <td className="py-3 text-right">{l.currency || 'UYU'} {l.price.toFixed(2)}</td>
                      <td className="py-3 text-center">
                        <input type="number" min={1} max={l.maxStock} value={l.quantity}
                          onChange={e => updateQty(i, parseInt(e.target.value) || 1)}
                          className="w-16 text-center border rounded px-2 py-1 text-sm" />
                      </td>
                      <td className="py-3 text-right font-bold">{l.currency || 'UYU'} {(l.price * l.quantity).toFixed(2)}</td>
                      <td className="py-3 text-center">
                        <button onClick={() => removeLine(i)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-400 py-8">Busque y agregue productos al pedido</p>
            )}

            <div className="mt-4 pt-4 border-t text-right flex flex-col gap-1 items-end">
              {subtotalUYU > 0 && <span className="text-lg font-bold">Total UYU: {subtotalUYU.toFixed(2)}</span>}
              {subtotalUSD > 0 && <span className="text-lg font-bold text-green-700">Total USD: {subtotalUSD.toFixed(2)}</span>}
              {subtotalUYU === 0 && subtotalUSD === 0 && <span className="text-lg font-bold">Total: 0.00</span>}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Dirección de envío</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Dirección</label>
                <input value={shipping.addr} onChange={e => setShipping({ ...shipping, addr: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ciudad</label>
                <input value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Teléfono de contacto</label>
                <input value={shipping.phone} onChange={e => setShipping({ ...shipping, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client select */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Cliente</h3>
            <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" />
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} size={5}
              className="w-full border border-gray-200 rounded-lg text-sm overflow-y-auto">
              <option value="">-- Seleccionar --</option>
              {filteredUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            {selectedUserObj && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                <div className="font-medium">{selectedUserObj.name}</div>
                <div className="text-xs text-gray-500">{selectedUserObj.email}</div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Pago</h3>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="mercadopago">MercadoPago</option>
              <option value="credit_card">Tarjeta de crédito</option>
              <option value="admin">Registrado por admin</option>
            </select>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Notas</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Notas internas..." />
          </div>

          {/* Summary & submit */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Resumen</h3>
            <div className="text-sm space-y-1 text-gray-600">
              <div className="flex justify-between"><span>Productos:</span><span>{lines.length}</span></div>
              <div className="flex justify-between"><span>Items:</span><span>{lines.reduce((s, l) => s + l.quantity, 0)}</span></div>
              {subtotalUYU > 0 && <div className="flex justify-between font-bold text-lg pt-2 border-t text-gray-800"><span>Total UYU:</span><span>{subtotalUYU.toFixed(2)}</span></div>}
              {subtotalUSD > 0 && <div className="flex justify-between font-bold text-lg pt-2 border-t text-green-700"><span>Total USD:</span><span>{subtotalUSD.toFixed(2)}</span></div>}
            </div>
            <button onClick={handleCreate} disabled={saving || !selectedUser || !lines.length}
              className="w-full mt-4 bg-[#e8850c] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Creando...' : 'Crear Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
