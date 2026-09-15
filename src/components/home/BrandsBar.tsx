'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export default function BrandsBar() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch('/api/public/brands')
      .then((r) => r.json())
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setBrands([]));
  }, []);

  useEffect(() => {
    if (brands.length < 2) return;
    const timer = setInterval(() => setCurrent(value => (value + 1) % brands.length), 3500);
    return () => clearInterval(timer);
  }, [brands.length]);

  if (brands.length === 0) return null;
  const visibleBrands = brands.map((_, index) => brands[(current + index) % brands.length]);

  return (
    <section className="py-7 bg-white border-y border-[#ddd]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider">
            Marcas reconocidas
          </h3>
          <Link href="/productos" className="text-[12px] text-[#e8850c] hover:text-[#333] transition-colors">
            ver todas →
          </Link>
        </div>
        <div className="relative flex items-center gap-3">
          <button onClick={() => setCurrent(value => (value - 1 + brands.length) % brands.length)} aria-label="Marca anterior" className="rounded-full border px-2 text-xl text-gray-500">‹</button>
          <div className="flex flex-1 gap-4 overflow-hidden">
          {visibleBrands.map((brand) => (
            <Link
              key={brand.id}
              href={`/productos?brand=${encodeURIComponent(brand.slug)}`}
              className="flex min-w-[150px] flex-1 flex-col items-center gap-2 rounded-xl border border-gray-100 p-3 group"
              title={brand.name}
            >
              {brand.logo ? (
                <div className="relative h-12 w-28">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain grayscale group-hover:grayscale-0 transition-all duration-200"
                    sizes="80px"
                  />
                </div>
              ) : (
                <span className="text-[#666] group-hover:text-[#e8850c] font-semibold text-[13px] transition-colors">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}
          </div>
          <button onClick={() => setCurrent(value => (value + 1) % brands.length)} aria-label="Siguiente marca" className="rounded-full border px-2 text-xl text-gray-500">›</button>
        </div>
      </div>
    </section>
  );
}
