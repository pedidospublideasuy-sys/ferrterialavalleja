'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useCurrency } from '@/store/currency';

interface DBProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images: string;
  sku: string;
  shortDesc?: string | null;
  description?: string | null;
  _firstImage?: string;
  brand?: { name: string } | null;
  category?: { name: string; slug: string } | null;
  currency?: string | null;
}

function getFirstImage(p: DBProduct): string {
  if (p._firstImage && typeof p._firstImage === 'string') return p._firstImage;
  try {
    const arr = JSON.parse(p.images);
    const first = Array.isArray(arr) ? arr[0] : null;
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') return first.url || first.src || first.img || '/placeholder.png';
    return '/placeholder.png';
  } catch {
    return '/placeholder.png';
  }
}

function CarouselSection({
  title, categorySlug, products, hidePrices, autoScroll, firstSection = false,
}: {
  title: string;
  categorySlug: string;
  products: DBProduct[];
  hidePrices: boolean;
  autoScroll: boolean;
  firstSection?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const formatCurrency = useCurrency((s) => s.format);
  const isPaused = useRef(false);

  // Drag-to-scroll
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  // Auto-scroll
  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      if (isPaused.current || isDragging.current) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 4) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: el.clientWidth * 0.5, behavior: 'smooth' });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [autoScroll]);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    dragStartX.current = e.pageX - scrollRef.current.offsetLeft;
    dragScrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const delta = (x - dragStartX.current) * 1.5;
    scrollRef.current.scrollLeft = dragScrollLeft.current - delta;
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.userSelect = '';
    }
  };

  const catHref = `/productos?cat=${encodeURIComponent(categorySlug)}`;

  if (products.length === 0) return null;

  return (
    <section className={`mb-6 max-w-[1400px] mx-auto px-4 ${firstSection ? 'pt-4' : ''}`}>
      {/* Cabecera: flecha | TÍTULO CENTRADO | flecha — y "Ver más" a la derecha */}
      <div className="relative flex items-center justify-center mb-4">
        {/* Ver más — absoluto a la derecha */}
        <Link
          href={catHref}
          className="absolute right-0 text-[12px] text-[#e8850c] hover:text-[#333] font-medium transition-colors whitespace-nowrap"
        >
          Ver más →
        </Link>

        {/* Pill centrado con flechas + título */}
        <div className="flex items-center bg-[#2a2a2a] border-2 border-black rounded-full overflow-hidden shadow-lg">
          <button
            onClick={() => scroll('left')}
            className="px-4 py-2 text-white hover:bg-[#444] transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <Link
            href={catHref}
            className="px-5 py-2 text-white font-bold text-[13px] uppercase tracking-widest whitespace-nowrap hover:text-[#f0a040] transition-colors"
          >
            {title}
          </Link>
          <button
            onClick={() => scroll('right')}
            className="px-4 py-2 text-white hover:bg-[#444] transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', cursor: 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { onMouseUp(); isPaused.current = false; }}
        onMouseEnter={() => { isPaused.current = true; }}
      >
        {products.map((p) => {
          const img = getFirstImage(p);
          const productCurrency = (p.currency || 'USD') as 'USD' | 'UYU';
          const priceLabel = !hidePrices && p.price > 0 ? formatCurrency(p.price, productCurrency) : null;
          const priceParts = priceLabel ? priceLabel.match(/^([^\d]*)(\d[\d.,\s]*)(.*)$/) : null;
          const pricePrefix = priceParts ? priceParts[1].trim() : '';
          const priceNumber = priceParts ? priceParts[2].trim() : (priceLabel || '');

          return (
            <Link
              key={p.id}
              href={`/productos/${p.slug}`}
              draggable={false}
              className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(25%-9px)] lg:w-[170px] min-w-[155px] bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col overflow-hidden border border-gray-100"
            >
              {/* Imagen */}
              <div className="relative bg-white" style={{ paddingBottom: '80%' }}>
                {p.price > 0 && p.comparePrice && p.comparePrice > p.price && (
                  <span className="absolute top-1.5 left-1.5 z-10 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    -{Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)}%
                  </span>
                )}
                <div className="absolute inset-0 pointer-events-none">
                  <Image
                    src={img}
                    alt={p.name}
                    fill
                    className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                    sizes="180px"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 px-2.5 pt-2 pb-2 gap-0.5">
                {p.brand && (
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">{p.brand.name}</span>
                )}
                <h3 className="text-[11px] text-gray-800 font-semibold leading-snug line-clamp-2 min-h-[28px]">
                  {p.name}
                </h3>
                {(p.shortDesc || p.description) && (
                  <p className="text-[10px] text-gray-400 line-clamp-1 leading-tight">
                    {p.shortDesc || p.description}
                  </p>
                )}

                {/* Precio */}
                <div className="mt-auto pt-1.5">
                  {hidePrices ? (
                    <span className="text-[11px] text-[#e8850c] font-semibold">Consultar precio</span>
                  ) : p.price > 0 ? (
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[10px] font-semibold text-gray-500 leading-none">{pricePrefix}</span>
                      <span className="text-[18px] font-bold text-gray-900 leading-none">{priceNumber}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">Consultar</span>
                  )}
                </div>

                {/* Botón Comprar */}
                <div className="mt-1.5">
                  <span className="block w-full bg-[#e8850c] hover:bg-[#d47a0b] text-white text-[11px] font-bold py-1.5 rounded-lg text-center transition-colors">
                    🛒 {hidePrices ? 'Consultar' : 'Comprar'}
                  </span>
                </div>
              </div>

              {/* SKU */}
              <p className="text-center text-[8px] text-gray-300 uppercase tracking-wide font-mono pb-1.5 px-2">{p.sku}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function FeaturedProducts() {
  const [sections, setSections] = useState<{ title: string; slug: string; products: DBProduct[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidePrices, setHidePrices] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/public/settings?keys=hide_prices,home_carousel_auto');
      if (res.ok) {
        const s = await res.json();
        setHidePrices(s.hide_prices === 'true');
        setAutoScroll(s.home_carousel_auto === 'true');
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadSettings();
    // Un solo endpoint que devuelve todas las secciones ya agrupadas
    fetch('/api/public/home-sections')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSections(data);
      })
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, [loadSettings]);

  if (loading) {
    return (
      <div className="bg-[#f5f5f5] py-6 px-4 text-gray-400 text-sm text-center">
        Cargando productos…
      </div>
    );
  }

  if (sections.length === 0) return null;

  return (
    <div className="bg-[#f5f5f5] pt-2 pb-6 relative z-20">
      {sections.map((s, idx) => (
        <CarouselSection
          key={s.title}
          title={s.title}
          categorySlug={s.slug}
          products={s.products}
          hidePrices={hidePrices}
          autoScroll={autoScroll}
          firstSection={idx === 0}
        />
      ))}
    </div>
  );
}
