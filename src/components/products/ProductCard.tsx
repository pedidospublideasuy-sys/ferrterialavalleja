'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useCart, CartProduct } from '@/store/cart';
import { useCurrency } from '@/store/currency';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    images: string;
    sku: string;
    stock: number;
    isNew: boolean;
    featured: boolean;
    description?: string | null;
    shortDesc?: string | null;
    category?: { name: string } | null;
    brand?: { name: string } | null;
    currency?: string | null;
    sourceApi?: string | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((s) => s.addItem);
  const { format } = useCurrency();
  const [qty, setQty] = useState(1);
  const { data: session } = useSession();
  const router = useRouter();

  const [hidePrices, setHidePrices] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    fetch('/api/public/settings?keys=hide_prices,site_whatsapp')
      .then(r => r.json())
      .then(data => {
        setHidePrices(data.hide_prices === 'true');
        setWhatsapp(data.site_whatsapp || '');
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    try { setFavorite(JSON.parse(localStorage.getItem('favorites') || '[]').includes(product.id)); } catch { /* ignore invalid local storage */ }
  }, [product.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const current: string[] = JSON.parse(localStorage.getItem('favorites') || '[]');
    const next = favorite ? current.filter(id => id !== product.id) : [...new Set([...current, product.id])];
    localStorage.setItem('favorites', JSON.stringify(next));
    window.dispatchEvent(new Event('favorites-changed'));
    setFavorite(!favorite);
    toast.success(favorite ? 'Quitado de favoritos' : 'Agregado a favoritos');
  };

  let images: string[] = [];
  try { images = JSON.parse(product.images || '[]'); } catch { }
  const mainImage = images[0] || null;

  const productCurrency = (product.sourceApi ? 'UYU' : product.currency || 'UYU') as 'USD' | 'UYU';

  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (product.stock <= 0) return;
    const cartProduct: CartProduct = {
      id: product.id, name: product.name, slug: product.slug,
      price: product.price, image: mainImage || '', sku: product.sku, stock: product.stock,
      currency: productCurrency,
    };
    for (let i = 0; i < qty; i++) addItem(cartProduct);
    toast.success(`${qty > 1 ? qty + 'x ' : ''}Agregado al carrito`);
    setQty(1);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (product.stock <= 0) return;
    const cartProduct: CartProduct = {
      id: product.id, name: product.name, slug: product.slug,
      price: product.price, image: mainImage || '', sku: product.sku, stock: product.stock,
      currency: productCurrency,
    };
    for (let i = 0; i < qty; i++) addItem(cartProduct);
    router.push('/checkout');
  };

  const incQty = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setQty(q => Math.min(q + 1, product.stock || 99)); };
  const decQty = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setQty(q => Math.max(1, q - 1)); };

  const priceLabel = format(product.price, productCurrency);
  const comparePriceLabel = product.comparePrice ? format(product.comparePrice, productCurrency) : null;

  // Separar el símbolo/prefijo del número para mostrarlo más grande
  const priceParts = priceLabel.match(/^([^\d]*)(\d[\d.,\s]*)(.*)$/);
  const pricePrefix = priceParts ? priceParts[1].trim() : '';
  const priceNumber = priceParts ? priceParts[2].trim() : priceLabel;

  return (
    <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col overflow-hidden">
      {/* ── Imagen ── */}
      <div className="relative bg-white" style={{ paddingBottom: '75%' }}>
        <button type="button" onClick={toggleFavorite} aria-label="Agregar a favoritos" className="absolute top-2 right-2 z-20 rounded-full bg-white/90 p-2 shadow hover:text-red-500">
          <HeartIcon className={`h-5 w-5 ${favorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
        </button>
        {/* Badges */}
        {product.isNew && (
          <span className="absolute top-2 left-2 z-10 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">NUEVO</span>
        )}
        {discount > 0 && (
          <span className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center">
            <span className="text-[10px] font-bold text-red-500 bg-white/90 px-3 py-1 rounded-full border border-red-200">Sin stock</span>
          </div>
        )}
        <Link href={`/productos/${product.slug}`} className="absolute inset-0">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-200 text-5xl select-none">📦</div>
          )}
        </Link>
      </div>

      {/* ── Info ── */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        {/* Marca */}
        {product.brand && (
          <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{product.brand.name}</span>
        )}

        {/* Nombre */}
        <Link href={`/productos/${product.slug}`}>
          <h3 className="text-[12px] text-gray-800 font-semibold leading-snug line-clamp-2 min-h-[2.5rem] hover:text-[#e8850c] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Descripción corta */}
        {(product.shortDesc || product.description) && (
          <p className="text-[11px] text-gray-400 line-clamp-1 leading-tight">
            {product.shortDesc || product.description}
          </p>
        )}

        {/* ── Precio ── */}
        <div className="mt-auto pt-2">
          {!hidePrices && comparePriceLabel && (
            <p className="text-[10px] text-gray-400 line-through leading-none mb-0.5">{comparePriceLabel}</p>
          )}

          {hidePrices ? (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Me interesa: ${product.name} (SKU: ${product.sku})`)}`}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors"
            >
              💬 Consultar
            </a>
          ) : product.price > 0 ? (
            <div className="flex items-baseline gap-1">
                <span className="text-[11px] font-semibold text-gray-500 leading-none">{productCurrency}</span>
              <span className="text-[22px] font-bold text-gray-900 leading-none">{priceNumber}</span>
            </div>
          ) : (
            <p className="text-[12px] text-gray-400 italic">
              {session ? 'Consultar precio' : 'Regístrate para ver precio'}
            </p>
          )}
        </div>

        {/* ── Botones ── */}
        {!hidePrices && product.stock > 0 && product.price > 0 ? (
          <div className="flex items-center gap-1.5 mt-1.5">
            {/* Qty */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
              <button onClick={decQty} className="w-6 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm">−</button>
              <span className="w-5 text-center text-[11px] font-medium">{qty}</span>
              <button onClick={incQty} className="w-6 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm">+</button>
            </div>
            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center w-8 h-7 border border-[#e8850c] text-[#e8850c] rounded-lg hover:bg-[#e8850c] hover:text-white transition-colors shrink-0"
              title="Agregar al carrito"
            >
              <ShoppingCartIcon className="h-4 w-4" />
            </button>
            {/* Comprar */}
            <button
              onClick={handleBuy}
              className="flex-1 bg-[#e8850c] hover:bg-[#d47a0b] text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              🛒 Comprar
            </button>
          </div>
        ) : product.stock <= 0 ? null : null}
      </div>

      {/* SKU */}
      <p className="text-center text-[9px] text-gray-300 uppercase tracking-wide font-mono pb-2 px-3">{product.sku}</p>
    </div>
  );
}