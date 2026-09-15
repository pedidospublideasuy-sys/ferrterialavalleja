'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';

interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
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
}

export default function FavoritesPage() {
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    let ids: string[] = [];
    try {
      const stored = JSON.parse(localStorage.getItem('favorites') || '[]');
      ids = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      ids = [];
    }
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const response = await fetch(`/api/products?ids=${encodeURIComponent(ids.join(','))}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudieron cargar los favoritos');
    const data = await response.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => {
    loadFavorites().catch(() => {
      setProducts([]);
      setLoading(false);
    });
    const refresh = () => loadFavorites().catch(() => setProducts([]));
    window.addEventListener('favorites-changed', refresh);
    return () => window.removeEventListener('favorites-changed', refresh);
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Mis favoritos</h1>
      {loading ? (
        <p className="text-gray-500">Cargando favoritos...</p>
      ) : products.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="mb-4 text-gray-500">Todavía no tenés productos favoritos.</p>
          <Link href="/productos" className="inline-block rounded-lg bg-[#e8850c] px-5 py-2 font-semibold text-white">Ver productos</Link>
        </div>
      )}
    </section>
  );
}
