'use client';

import { useCart } from '@/store/cart';
import { useCurrency } from '@/store/currency';
import Image from 'next/image';
import Link from 'next/link';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const convert = useCurrency((s) => s.convert);
  const displayCurrency = useCurrency((s) => s.currency);
  const convertedTotal = items.reduce((sum, item) => sum + convert(item.product.price, item.product.currency || 'UYU') * item.quantity, 0);
  const formatCurrency = useCurrency((s) => s.format);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-6">Agregá productos para empezar a comprar</p>
        <Link href="/productos" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
          Ver Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🛒 Mi Carrito</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="bg-white rounded-xl border p-4 flex gap-4 items-center">
              <div className="relative w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0">
                <Image src={item.product.image || '/placeholder-product.svg'} alt={item.product.name} fill className="object-contain p-2" sizes="80px" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/productos/${item.product.slug}`} className="font-medium text-gray-800 hover:text-blue-600 line-clamp-1">{item.product.name}</Link>
                <p className="text-sm text-gray-400">SKU: {item.product.sku}</p>
                <p className="font-bold text-blue-900 mt-1">{formatCurrency(item.product.price, item.product.currency || 'UYU')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 border rounded hover:bg-gray-100">
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 border rounded hover:bg-gray-100">
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">{formatCurrency(item.product.price * item.quantity, item.product.currency || 'UYU')}</p>
                <button onClick={() => removeItem(item.product.id)} className="text-red-500 hover:text-red-700 mt-1">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={clearCart} className="text-sm text-red-500 hover:underline">Vaciar carrito</button>
        </div>
        <div>
          <div className="bg-white rounded-xl border p-6 sticky top-24">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Resumen</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(convertedTotal, displayCurrency)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Envío</span><span className="text-green-600">A calcular</span></div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg"><span>Total</span><span className="text-blue-900">{formatCurrency(convertedTotal, displayCurrency)}</span></div>
            </div>
            <Link href="/checkout" className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Finalizar Compra
            </Link>
            <Link href="/productos" className="block w-full text-center py-3 text-blue-600 hover:underline text-sm mt-2">
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
