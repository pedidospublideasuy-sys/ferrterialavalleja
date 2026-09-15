'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface SubCategory {
  name: string;
  slug: string;
}

interface Category {
  name: string;
  slug: string;
  icon: React.ReactNode;
  subs: SubCategory[];
  image?: string;
  id?: string;
}

function IconAudio() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="12" y="6" width="16" height="28" rx="8" /><path d="M12 22H8v2a12 12 0 0024 0v-2h-4" /><line x1="20" y1="36" x2="20" y2="40" /><line x1="14" y1="40" x2="26" y2="40" /></svg>
  );
}

function IconGabinetes() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="8" y="2" width="24" height="36" rx="2" /><circle cx="20" cy="14" r="4" /><line x1="14" y1="24" x2="26" y2="24" /><circle cx="20" cy="32" r="2" /></svg>
  );
}

function IconNotebook() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="4" y="6" width="32" height="22" rx="2" /><path d="M2 28h36l-2 6H4l-2-6z" /><line x1="16" y1="31" x2="24" y2="31" /></svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="10" y="2" width="20" height="36" rx="3" /><line x1="16" y1="6" x2="24" y2="6" /><circle cx="20" cy="33" r="2" /></svg>
  );
}

function IconPortabilidad() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="6" y="8" width="28" height="20" rx="2" /><path d="M4 28h32l-2 6H6l-2-6z" /><circle cx="20" cy="18" r="5" /><line x1="20" y1="13" x2="20" y2="18" /><line x1="20" y1="18" x2="24" y2="20" /></svg>
  );
}

function IconHardware() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="4" y="4" width="32" height="32" rx="2" /><rect x="8" y="8" width="10" height="10" rx="1" /><rect x="24" y="8" width="8" height="4" rx="0.5" /><rect x="24" y="14" width="8" height="4" rx="0.5" /><rect x="8" y="24" width="6" height="8" rx="0.5" /><rect x="16" y="24" width="6" height="8" rx="0.5" /><circle cx="30" cy="28" r="3" /></svg>
  );
}

function IconGaming() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M8 14h24a6 6 0 016 6v0a6 6 0 01-6 6h-4l-2 4h-8l-2-4H8a6 6 0 01-6-6v0a6 6 0 016-6z" /><circle cx="14" cy="20" r="2" /><circle cx="26" cy="18" r="1.5" fill="currentColor" /><circle cx="30" cy="22" r="1.5" fill="currentColor" /></svg>
  );
}

function IconConectividad() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><circle cx="20" cy="8" r="4" /><circle cx="8" cy="28" r="4" /><circle cx="32" cy="28" r="4" /><line x1="20" y1="12" x2="8" y2="24" /><line x1="20" y1="12" x2="32" y2="24" /><line x1="8" y1="28" x2="32" y2="28" /></svg>
  );
}

function IconImpresion() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="8" y="4" width="24" height="10" rx="1" /><rect x="4" y="14" width="32" height="14" rx="2" /><rect x="10" y="24" width="20" height="12" rx="1" /><line x1="14" y1="28" x2="26" y2="28" /><line x1="14" y1="32" x2="26" y2="32" /><circle cx="30" cy="20" r="1.5" fill="currentColor" /></svg>
  );
}

function IconCDDVD() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><circle cx="20" cy="20" r="14" /><circle cx="20" cy="20" r="4" /><circle cx="20" cy="20" r="1" fill="currentColor" /></svg>
  );
}

function IconEnergia() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="4" y="8" width="32" height="24" rx="2" /><circle cx="20" cy="20" r="8" /><path d="M20 12v16M12 20h16" /><rect x="30" y="14" width="6" height="4" rx="1" /><rect x="30" y="22" width="6" height="4" rx="1" /></svg>
  );
}

function IconHogar() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M6 20L20 6l14 14" /><rect x="10" y="20" width="20" height="16" rx="1" /><rect x="16" y="28" width="8" height="8" /></svg>
  );
}

function IconArribados() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="6" y="12" width="28" height="22" rx="2" /><path d="M14 12V8a6 6 0 0112 0v4" /><line x1="20" y1="20" x2="20" y2="28" /><path d="M16 24l4 4 4-4" /></svg>
  );
}

function IconArribando() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M8 8h24M6 14h28M4 20h32M6 26h28M8 32h24" /><path d="M20 6v30" /></svg>
  );
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    name: 'Audio Imagen', slug: 'audio', icon: <IconAudio />,
    subs: [{ name: 'Auriculares', slug: 'auriculares' }, { name: 'Parlantes', slug: 'parlantes' }, { name: 'Micrófonos', slug: 'microfonos' }, { name: 'TV y Video', slug: 'tv-video' }],
  },
  {
    name: 'Gabinetes Accesorios', slug: 'gabinetes', icon: <IconGabinetes />,
    subs: [{ name: 'ATX', slug: 'gabinetes-atx' }, { name: 'Micro ATX', slug: 'gabinetes-matx' }, { name: 'Mini ITX', slug: 'gabinetes-itx' }, { name: 'Accesorios', slug: 'gabinetes-acc' }],
  },
  {
    name: 'Notebook PC Tablet', slug: 'notebooks', icon: <IconNotebook />,
    subs: [{ name: 'Equipos nuevos', slug: 'notebooks-nuevos' }, { name: 'Tablets, ebook y accesorios', slug: 'tablets' }, { name: 'Equipos factory refurbished', slug: 'refurbished' }, { name: 'Equipos recertificados', slug: 'recertificados' }],
  },
  {
    name: 'Telefonía Smartwatch', slug: 'telefonia', icon: <IconPhone />,
    subs: [{ name: 'Accesorios', slug: 'telefonia-acc' }, { name: 'Celulares', slug: 'celulares' }, { name: 'Relojes smartwatch y pulseras', slug: 'smartwatch' }, { name: 'Repuestos', slug: 'repuestos-tel' }],
  },
  {
    name: 'Portabilidad', slug: 'portabilidad', icon: <IconPortabilidad />,
    subs: [{ name: 'Pendrives', slug: 'pendrives' }, { name: 'Discos externos', slug: 'discos-ext' }, { name: 'Memorias flash', slug: 'memorias-flash' }, { name: 'Lectores', slug: 'lectores' }],
  },
  {
    name: 'Hardware Accesorios', slug: 'hardware', icon: <IconHardware />,
    subs: [{ name: 'Motherboards', slug: 'motherboards' }, { name: 'Procesadores', slug: 'procesadores' }, { name: 'Memorias RAM', slug: 'memorias' }, { name: 'Almacenamiento', slug: 'almacenamiento' }, { name: 'Tarjetas de video', slug: 'tarjetas-video' }],
  },
  {
    name: 'Gaming', slug: 'gaming', icon: <IconGaming />,
    subs: [{ name: 'Teclados', slug: 'teclados-gamer' }, { name: 'Mouse', slug: 'mouse-gamer' }, { name: 'Auriculares', slug: 'auriculares-gamer' }, { name: 'Sillas', slug: 'sillas-gamer' }, { name: 'Monitores', slug: 'monitores-gamer' }],
  },
  {
    name: 'Conectividad', slug: 'conectividad', icon: <IconConectividad />,
    subs: [{ name: 'Routers', slug: 'routers' }, { name: 'Switches', slug: 'switches' }, { name: 'Adaptadores WiFi', slug: 'wifi' }, { name: 'Cables de red', slug: 'cables-red' }],
  },
  {
    name: 'Impresión', slug: 'impresion', icon: <IconImpresion />,
    subs: [{ name: 'Inkjet', slug: 'impresoras-inkjet' }, { name: 'Láser', slug: 'impresoras-laser' }, { name: 'Multifunción', slug: 'impresoras-multi' }, { name: 'Toners y tintas', slug: 'toners' }],
  },
  {
    name: 'CD DVD', slug: 'cd-dvd', icon: <IconCDDVD />,
    subs: [{ name: 'Grabadoras', slug: 'grabadoras' }, { name: 'Medios', slug: 'medios-cd' }, { name: 'Lectores', slug: 'lectores-cd' }],
  },
  {
    name: 'Energía', slug: 'energia', icon: <IconEnergia />,
    subs: [{ name: 'Fuentes PC', slug: 'fuentes' }, { name: 'UPS', slug: 'ups' }, { name: 'Estabilizadores', slug: 'estabilizadores' }, { name: 'Zapatillas', slug: 'zapatillas' }],
  },
  {
    name: 'Hogar', slug: 'hogar', icon: <IconHogar />,
    subs: [{ name: 'Electrodomésticos', slug: 'electrodomesticos' }, { name: 'Iluminación', slug: 'iluminacion' }, { name: 'Seguridad', slug: 'seguridad' }],
  },
  {
    name: 'Arribados', slug: 'arribados', icon: <IconArribados />,
    subs: [{ name: 'Recién llegados', slug: 'recien-llegados' }, { name: 'Últimas novedades', slug: 'novedades' }],
  },
  {
    name: 'Arribando', slug: 'arribando', icon: <IconArribando />,
    subs: [{ name: 'Próximos arribos', slug: 'proximos' }, { name: 'Reservas', slug: 'reservas' }],
  },
];

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [titleStyle, setTitleStyle] = useState({ background: '#ffffff', color: '#1f2937', width: '100%' });
  const [current, setCurrent] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/settings?keys=home_carousel_categories,home_category_title_bg,home_category_title_color,home_category_title_width').then(r => r.ok ? r.json() : {}),
      fetch('/api/categories').then(r => r.ok ? r.json() : []),
    ]).then(([settings, dbCategories]) => {
      const publicSettings = settings as { home_carousel_categories?: string; home_category_title_bg?: string; home_category_title_color?: string; home_category_title_width?: string };
      setTitleStyle({
        background: publicSettings.home_category_title_bg || '#ffffff',
        color: publicSettings.home_category_title_color || '#1f2937',
        width: publicSettings.home_category_title_width || '100%',
      });
      let selected: string[] = [];
      try {
        const parsed = JSON.parse(publicSettings.home_carousel_categories || '[]');
        if (Array.isArray(parsed)) selected = parsed.filter((slug): slug is string => typeof slug === 'string');
      } catch { /* use defaults when not configured */ }
      if (!Array.isArray(dbCategories)) return;
      if (!Object.prototype.hasOwnProperty.call(publicSettings, 'home_carousel_categories')) return;
      if (!selected.length) {
        setCategories([]);
        return;
      }
      const flat = dbCategories.flatMap((category: Category & { children?: Category[] }) => [category, ...(category.children || [])]);
      const configured: Category[] = [];
      selected.forEach(slug => {
        const dbCategory = flat.find(category => category.slug === slug);
        const fallback = DEFAULT_CATEGORIES.find(category => category.slug === slug);
        if (!dbCategory && !fallback) return;
        configured.push({
          ...(fallback || { name: dbCategory!.name, slug, icon: <span className="text-2xl">▦</span>, subs: [] }),
          name: dbCategory?.name || fallback!.name,
          image: dbCategory?.image || fallback?.image,
          subs: fallback?.subs || [],
        });
      });
      setCategories(configured);
    }).catch(() => { /* keep defaults */ });
  }, []);

  useEffect(() => {
    if (categories.length < 2) return;
    const timer = setInterval(() => {
      setCurrent(value => (value + 1) % categories.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [categories.length]);

  const scroll = (direction: number) => {
    navRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' });
  };

  return (
    <nav className="relative z-40 bg-white border-x border-b border-gray-100">
      <div className="store-section-title mx-auto mt-5 mb-2 px-4 py-2 rounded-lg text-center" style={{ backgroundColor: titleStyle.background, color: titleStyle.color, width: `min(${titleStyle.width}, calc(100% - 2rem))` }}>Categorías destacadas</div>
      <div className="relative max-w-7xl mx-auto px-8 pb-5">
        <button onClick={() => scroll(-1)} aria-label="Categorías anteriores" className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 text-xl text-gray-500 shadow-md hover:text-[#4a2fc5]">‹</button>
        <div ref={navRef} className="flex gap-4 overflow-x-auto scroll-smooth px-1 py-2 [scrollbar-width:none]">
        {categories.map((cat, i) => (
          <Link
            key={cat.slug}
            href={`/productos?cat=${cat.slug}`}
            onClick={() => setCurrent(i)}
            className={`group relative min-w-[180px] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-all hover:-translate-y-1 hover:border-[#4a2fc5] hover:shadow-lg ${i === current ? 'ring-2 ring-[#4a2fc5]/30' : ''}`}
          >
            <div className="relative h-[110px] w-full bg-gray-100">
              {cat.image ? (
                <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center text-[#4a2fc5] opacity-70">{cat.icon}</div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                <span className="text-sm font-semibold text-white">{cat.name}</span>
              </div>
            </div>
          </Link>
        ))}
        </div>
        <button onClick={() => scroll(1)} aria-label="Siguientes categorías" className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 text-xl text-gray-500 shadow-md hover:text-[#4a2fc5]">›</button>
      </div>
    </nav>
  );
}
