'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/store/cart';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { useCurrency } from '@/store/currency';

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  sku: string;
  price: number;
  currency?: string | null;
  comparePrice: number | null;
  stock: number;
  images: string;
  featured: boolean;
  isNew: boolean;
  specs: string | null;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
}

function formatDescription(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|h[1-6]|li)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [hidePrices, setHidePrices] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const addItem = useCart((s) => s.addItem);
  const formatCurrency = useCurrency((s) => s.format);

  useEffect(() => {
    fetch('/api/products/' + slug)
      .then((r) => r.json())
      .then((data) => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));

    fetch('/api/public/settings?keys=hide_prices,site_whatsapp')
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, string>) => {
        setHidePrices(data.hide_prices === 'true');
        if (data.site_whatsapp) setWaPhone(data.site_whatsapp.replace(/\D/g, ''));
      })
      .catch(() => {});
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Producto no encontrado</h1>
        <Link href="/productos" className="text-blue-600 hover:underline">Volver a productos</Link>
      </div>
    );
  }

  const images: string[] = JSON.parse(product.images || '[]');
  if (images.length === 0) images.push('/placeholder-product.svg');
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;
  const specs: Record<string, string> = product.specs ? JSON.parse(product.specs) : {};

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      currency: product.currency === 'USD' ? 'USD' : 'UYU',
      image: images[0],
      sku: product.sku,
      stock: product.stock,
    }, qty);
    toast.success('Agregado al carrito');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-blue-600">Inicio</Link>
        <span>/</span>
        <Link href="/productos" className="hover:text-blue-600">Productos</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={'/productos?category=' + product.category.slug} className="hover:text-blue-600">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-800">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="bg-white rounded-xl border p-6 mb-4">
            <div className="relative aspect-square">
              <Image
                src={images[selectedImg]}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {product.isNew && (
                <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded">NUEVO</span>
              )}
              {discount > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">-{discount}%</span>
              )}
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)}
                  className={'w-16 h-16 rounded-lg border-2 overflow-hidden ' + (i === selectedImg ? 'border-blue-600' : 'border-gray-200')}>
                  <Image src={img} alt="" width={64} height={64} className="object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">{product.brand.name}</p>
          )}
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
          <p className="text-sm text-gray-400 mb-4">SKU: {product.sku}</p>

          <div className="flex items-center gap-4 mb-6">
            {hidePrices ? (
              <a
                href={waPhone
                  ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hola, quisiera consultar el precio de: ${product.name} (SKU: ${product.sku})`)}`
                  : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Consultar precio
              </a>
            ) : (
              <>
                <span className="text-3xl font-extrabold text-blue-900">{formatCurrency(product.price, product.currency === 'USD' ? 'USD' : 'UYU')}</span>
                {product.comparePrice && (
                  <span className="text-lg text-gray-400 line-through">{formatCurrency(product.comparePrice, product.currency === 'USD' ? 'USD' : 'UYU')}</span>
                )}
                {discount > 0 && (
                  <span className="bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full">Ahorro {discount}%</span>
                )}
              </>
            )}
          </div>

          {product.shortDesc && <p className="text-gray-600 mb-6">{product.shortDesc}</p>}

          <div className="flex items-center gap-2 mb-6">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                En stock ({product.stock} disponibles)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                Sin stock
              </span>
            )}
          </div>

          {product.stock > 0 && !hidePrices && (
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border rounded-lg">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 hover:bg-gray-100 text-lg font-bold">-</button>
                <span className="px-4 py-2 min-w-[3rem] text-center font-medium">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-4 py-2 hover:bg-gray-100 text-lg font-bold">+</button>
              </div>
              <button onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                <ShoppingCartIcon className="h-5 w-5" />
                Agregar al Carrito
              </button>
            </div>
          )}

          {Object.keys(specs).length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-800 mb-3">Especificaciones</h3>
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(specs).map(([key, val]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-2 text-gray-500 w-1/3">{key}</td>
                      <td className="py-2 font-medium text-gray-800">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {product.description && (
            <div className="border-t pt-6 mt-6">
              <h3 className="font-bold text-gray-800 mb-3">Descripcion</h3>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{formatDescription(product.description)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
