'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/store/cart';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { useCurrency } from '@/store/currency';

interface Variant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  sku: string;
  price: number;
  currency?: string | null;
  sourceApi?: string | null;
  comparePrice: number | null;
  stock: number;
  images: string;
  featured: boolean;
  isNew: boolean;
  specs: string | null;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
  variants?: Variant[];
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
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [hidePrices, setHidePrices] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [favorite, setFavorite] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const formatCurrency = useCurrency((s) => s.format);

  useEffect(() => {
    fetch('/api/products/' + slug)
      .then((r) => r.json())
      .then((data) => { 
        setProduct(data); 
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        setLoading(false); 
      })
      .catch(() => setLoading(false));

    fetch('/api/public/settings?keys=hide_prices,site_whatsapp')
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, string>) => {
        setHidePrices(data.hide_prices === 'true');
        if (data.site_whatsapp) setWaPhone(data.site_whatsapp.replace(/\D/g, ''));
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    try { setFavorite(JSON.parse(localStorage.getItem('favorites') || '[]').includes(product.id)); } catch { /* ignore invalid local storage */ }
  }, [product]);

  const toggleFavorite = () => {
    if (!product) return;
    const current: string[] = JSON.parse(localStorage.getItem('favorites') || '[]');
    const next = favorite ? current.filter(id => id !== product.id) : [...new Set([...current, product.id])];
    localStorage.setItem('favorites', JSON.stringify(next));
    window.dispatchEvent(new Event('favorites-changed'));
    setFavorite(!favorite);
    toast.success(favorite ? 'Quitado de favoritos' : 'Agregado a favoritos');
  };

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
  
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentComparePrice = selectedVariant ? selectedVariant.comparePrice : product.comparePrice;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const currentSku = selectedVariant && selectedVariant.sku ? selectedVariant.sku : product.sku;

  const discount = currentComparePrice
    ? Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)
    : 0;
  const specs: Record<string, string> = product.specs ? JSON.parse(product.specs) : {};

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
      slug: product.slug,
      price: currentPrice,
      currency: product.currency === 'USD' ? 'USD' : 'UYU',
      image: images[0],
      sku: currentSku,
      stock: currentStock,
      variantId: selectedVariant ? selectedVariant.id : undefined
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
          <div className="flex items-start gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 flex-1">{product.name}</h1>
            <button type="button" onClick={toggleFavorite} aria-label="Agregar a favoritos" className="rounded-full border p-2 hover:text-red-500">
              <HeartIcon className={`h-6 w-6 ${favorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-4">SKU: {currentSku}</p>

          <div className="flex items-center gap-4 mb-6">
            {hidePrices ? (
              <a
                href={waPhone
                  ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hola, quisiera consultar el precio de: ${product.name} (SKU: ${currentSku})`)}`
                  : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
              >
                Consultar precio
              </a>
            ) : (
              <>
                <span className="text-3xl font-extrabold text-blue-900">{formatCurrency(currentPrice, product.sourceApi ? 'UYU' : product.currency === 'USD' ? 'USD' : 'UYU')}</span>
                {currentComparePrice && (
                  <span className="text-lg text-gray-400 line-through">{formatCurrency(currentComparePrice, product.sourceApi ? 'UYU' : product.currency === 'USD' ? 'USD' : 'UYU')}</span>
                )}
                {discount > 0 && (
                  <span className="bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full">Ahorro {discount}%</span>
                )}
              </>
            )}
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Seleccionar Opción:</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVariant(v); setQty(1); }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedVariant?.id === v.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-400 text-gray-700'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.shortDesc && <p className="text-gray-600 mb-6">{product.shortDesc}</p>}

          <div className="flex items-center gap-2 mb-6">
            {currentStock > 0 ? (
              <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                En stock ({currentStock} disponibles)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                Sin stock
              </span>
            )}
          </div>

          {currentStock > 0 && !hidePrices && (
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border rounded-lg">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 hover:bg-gray-100 text-lg font-bold">-</button>
                <span className="px-4 py-2 min-w-[3rem] text-center font-medium">{qty}</span>
                <button onClick={() => setQty(Math.min(currentStock, qty + 1))} className="px-4 py-2 hover:bg-gray-100 text-lg font-bold">+</button>
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
