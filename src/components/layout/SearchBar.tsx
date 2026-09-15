'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCurrency } from '@/store/currency';
import Link from 'next/link';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  image: string;
  sku: string;
  brand: string | null;
}

export default function SearchBar({ categoryFilter }: { categoryFilter?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const formatCurrency = useCurrency((s) => s.format);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const cat = categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : '';
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}${cat}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setOpen(true); // siempre abrir para mostrar resultados o "sin resultados"
        setActiveIndex(-1);
      } else {
        setResults([]);
        setOpen(true);
      }
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleFullSearch();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        window.location.href = `/productos/${results[activeIndex].slug}`;
      } else {
        handleFullSearch();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleFullSearch = () => {
    if (query.trim()) {
      window.location.href = `/productos?search=${encodeURIComponent(query.trim())}`;
      setOpen(false);
    }
  };

  const stockBadge = (stock: number) => {
    if (stock > 10) return <span className="text-[11px] font-semibold text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>En stock</span>;
    if (stock > 0) return <span className="text-[11px] font-semibold text-yellow-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full inline-block"></span>Últimas {stock} uds</span>;
    return <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span>Sin stock</span>;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex w-full h-[38px]">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder="Buscar productos, marcas y más..."
            className="w-full h-full bg-white text-gray-800 pl-4 pr-10 text-[13px] focus:outline-none placeholder-gray-400"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#e8850c] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleFullSearch}
          className="bg-[#e8850c] text-white px-4 hover:bg-[#d47a0b] transition-colors flex items-center"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 z-[200] overflow-hidden" style={{ maxHeight: '480px' }}>
          <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-[13px]">
                <span className="text-2xl block mb-2">🔍</span>
                No se encontraron productos para <strong className="text-gray-600">&quot;{query}&quot;</strong>
              </div>
            ) : (
              results.map((item, index) => {
              const discount = item.comparePrice && item.comparePrice > item.price
                ? Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)
                : 0;
              return (
                <Link
                  key={item.id}
                  href={`/productos/${item.slug}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 hover:bg-[#f5f5f5] transition-colors border-b border-gray-100 last:border-0 ${index === activeIndex ? 'bg-[#f0f7ff]' : ''}`}
                >
                  <div className="w-[56px] h-[56px] flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <span className="text-gray-300 text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-800 font-medium leading-tight line-clamp-2">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.brand && <span className="text-[10px] text-gray-400">{item.brand}</span>}
                      <span className="text-[10px] text-gray-300">SKU: {item.sku}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {discount > 0 && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{discount}% OFF</span>
                      )}
                    </div>
                    {item.comparePrice && item.comparePrice > item.price && (
                      <p className="text-[11px] text-gray-400 line-through">{formatCurrency(item.comparePrice, 'UYU')}</p>
                    )}
                    <p className="text-[16px] font-bold text-gray-900">{formatCurrency(item.price, 'UYU')}</p>
                    <div className="mt-0.5">{stockBadge(item.stock)}</div>
                  </div>
                </Link>
              );
            }))}
          </div>
          <button
            onClick={handleFullSearch}
            className="w-full px-4 py-3 text-center text-[13px] font-semibold text-[#e8850c] hover:bg-[#fff8f0] transition-colors border-t border-gray-200"
          >
            Ver todos los resultados para &quot;{query}&quot; →
          </button>
        </div>
      )}
    </div>
  );
}