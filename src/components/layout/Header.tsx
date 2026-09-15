'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  ShoppingCartIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useCart } from '@/store/cart';
import { useCurrency } from '@/store/currency';
import SearchBar from './SearchBar';

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  children: { id: string; name: string; slug: string }[];
}

interface CustomMenuItem {
  id: string;
  label: string;
  href: string;
  icon: string | null;
  openNew: boolean;
  children: CustomMenuItem[];
}

// Fallback categories in case API fails
const fallbackCategories: MenuCategory[] = [
  { id: '1', name: 'Notebooks', slug: 'notebooks', icon: null, children: [] },
  { id: '2', name: 'PC Escritorio', slug: 'pc-escritorio', icon: null, children: [] },
  { id: '3', name: 'Componentes', slug: 'componentes', icon: null, children: [] },
  { id: '4', name: 'Monitores', slug: 'monitores', icon: null, children: [] },
  { id: '5', name: 'Periféricos', slug: 'perifericos', icon: null, children: [] },
  { id: '6', name: 'Impresoras', slug: 'impresoras', icon: null, children: [] },
  { id: '7', name: 'Redes', slug: 'redes', icon: null, children: [] },
  { id: '8', name: 'Accesorios', slug: 'accesorios', icon: null, children: [] },
];

export default function Header() {
  const { data: session } = useSession();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchCategory, setSearchCategory] = useState('all');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const totalItems = useCart((s) => s.totalItems);
  const totalPrice = useCart((s) => s.totalPrice);

  const [logoText, setLogoText] = useState('Ferretería Lavalleja');
  const [logoAccent, setLogoAccent] = useState('Ferretería');
  const [logoColor, setLogoColor] = useState('#ffffff');
  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [logoMode, setLogoMode] = useState('logo_text');
  const [logoWidth, setLogoWidth] = useState('140');
  const [logoHeight, setLogoHeight] = useState('40');
  const [colorPrimary, setColorPrimary] = useState('#0b9bd7');
  const [colorSecondary, setColorSecondary] = useState('#315b91');
  const [colorAccent, setColorAccent] = useState('#4a2fc5');

  const currency = useCurrency((s) => s.currency);
  const setCurrency = useCurrency((s) => s.setCurrency);
  const formatCurrency = useCurrency((s) => s.format);
  const fetchRate = useCurrency((s) => s.fetchRate);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(fallbackCategories);
  const [hamburgerCategories, setHamburgerCategories] = useState<MenuCategory[]>(fallbackCategories);
  const [allMenuCategories, setAllMenuCategories] = useState<MenuCategory[]>(fallbackCategories);
  const [menuCategorySlugs, setMenuCategorySlugs] = useState<string[] | null>(null);
  const [hamburgerCategorySlugs, setHamburgerCategorySlugs] = useState<string[] | null>(null);
  const [customMenuItems, setCustomMenuItems] = useState<CustomMenuItem[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchRate(); // actualiza cotización USD/UYU si hace más de 1h
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/public/menu');
        const data = await res.json();
        if (data.categories?.length) {
          setAllMenuCategories(data.categories);
          setMenuCategories(data.categories);
          setHamburgerCategories(data.categories);
        }
        if (data.menuItems) setCustomMenuItems(data.menuItems);
      } catch { /* keep fallback */ }
    };
    fetchMenu();
    fetch('/api/public/settings?keys=logo_text,logo_accent,logo_color,logo_image_url,logo_mode,logo_width,logo_height,color_primary,color_secondary,color_accent,menu_categories,hamburger_categories')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        if (data.logo_text) setLogoText(data.logo_text);
        if (data.logo_accent) setLogoAccent(data.logo_accent);
        if (data.logo_color) setLogoColor(data.logo_color);
        if (data.logo_image_url) setLogoImageUrl(data.logo_image_url);
        if (data.logo_mode) setLogoMode(data.logo_mode);
        if (data.logo_width) setLogoWidth(data.logo_width);
        if (data.logo_height) setLogoHeight(data.logo_height);
        if (data.color_primary) setColorPrimary(data.color_primary);
        if (data.color_secondary) setColorSecondary(data.color_secondary);
        if (data.color_accent) setColorAccent(data.color_accent);
        const parseSlugs = (value: string | undefined) => {
          if (!value) return null;
          try {
            const slugs = JSON.parse(value);
            return Array.isArray(slugs) ? slugs.filter((slug): slug is string => typeof slug === 'string') : null;
          } catch { return null; }
        };
        setMenuCategorySlugs(parseSlugs(data.menu_categories));
        setHamburgerCategorySlugs(parseSlugs(data.hamburger_categories));
      })
      .catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filter = (slugs: string[] | null) => slugs ? allMenuCategories.filter(category => slugs.includes(category.slug)) : allMenuCategories;
    setMenuCategories(filter(menuCategorySlugs));
    setHamburgerCategories(filter(hamburgerCategorySlugs));
  }, [allMenuCategories, menuCategorySlugs, hamburgerCategorySlugs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cartCount = mounted ? totalItems() : 0;
  const cartTotal = mounted ? totalPrice() : 0;

  return (
    <header className="sticky top-0 z-50">
      {/* Main header bar */}
      <div className="bg-[#0b9bd7]" style={{ backgroundColor: colorPrimary }}>
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between min-h-[92px] gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            {logoImageUrl ? (
              <Image src={logoImageUrl} alt={logoText} width={Number(logoWidth) || 140} height={Number(logoHeight) || 40}
                className="object-contain" style={{ width: `${Number(logoWidth) || 140}px`, height: `${Number(logoHeight) || 40}px` }} unoptimized />
            ) : (
              logoMode !== 'logo' &&
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none"
                style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                <span style={{ color: logoColor }}>{logoAccent}</span>
                {logoText.slice(logoAccent.length)}
              </div>
            )}
          </Link>

          {/* Search Bar con selector de categoría */}
          <div className="hidden md:flex flex-1 max-w-2xl" style={{ overflow: 'visible' }}>
            <div className="flex w-full shadow-sm" style={{ overflow: 'visible', borderRadius: '9999px' }}>
              {/* Selector categoría */}
              <div className="relative flex-shrink-0">
                <select
                  value={searchCategory}
                  onChange={e => setSearchCategory(e.target.value)}
                  className="appearance-none h-full bg-[#087eaf] text-white text-xs px-3 pr-7 border-r border-white/20 cursor-pointer focus:outline-none rounded-l-full"
                >
                  <option value="all">Todas las categorías</option>
                  {menuCategories.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none" />
              </div>
              {/* Input búsqueda */}
              <div className="flex-1 bg-white" style={{ overflow: 'visible' }}>
                <SearchBar categoryFilter={searchCategory !== 'all' ? searchCategory : undefined} />
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Selector de moneda */}
            <div className="flex items-center bg-[#2a2a2a] rounded-full overflow-hidden text-[11px] font-bold border border-[#3a3a3a]">
              <button
                onClick={() => setCurrency('UYU')}
                className={`px-2.5 py-1 transition-colors ${currency === 'UYU' ? 'text-white' : 'text-white/70 hover:text-white'}`}
                style={currency === 'UYU' ? { backgroundColor: colorAccent } : undefined}
              >
                UYU
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 transition-colors ${currency === 'USD' ? 'text-white' : 'text-white/70 hover:text-white'}`}
                style={currency === 'USD' ? { backgroundColor: colorAccent } : undefined}
              >
                USD
              </button>
            </div>
            {/* Favoritos */}
            <Link href="/favoritos" className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm">
              <HeartIcon className="h-5 w-5" />
              <span className="hidden lg:inline text-xs">Favoritos</span>
            </Link>

            {/* Usuario */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors text-sm"
              >
                <UserIcon className="h-5 w-5" />
                <span className="hidden lg:inline text-xs max-w-[80px] truncate">
                  {session ? session.user.name : 'Ingresar'}
                </span>
                <ChevronDownIcon className="h-3 w-3" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                  {session ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-800 truncate">{session.user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{session.user.email}</p>
                      </div>
                      <Link href="/mi-cuenta" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mi cuenta</Link>
                      {(session.user.role === 'admin' || session.user.role === 'store_admin') && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-[#e8850c] hover:bg-gray-50">Panel Admin</Link>
                      )}
                      <button onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50">
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Ingresar</Link>
                      <Link href="/auth/register" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Registrarme</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Carrito */}
            <Link href="/carrito"
              className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#333] px-3 py-2 rounded-lg transition-colors">
              <div className="relative">
                <ShoppingCartIcon className="h-5 w-5 text-white" />
                <span className="absolute -top-2 -right-2 bg-[#00d4aa] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-[10px] text-gray-400 leading-none">{currency}</div>
                <div className="text-sm font-bold text-white leading-none">{mounted ? formatCurrency(cartTotal) : '—'}</div>
              </div>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-white p-2">
            {mobileMenu ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Nav bar de categorías — solo desktop */}
      <nav className="hidden md:block bg-[#315b91] border-t border-white/10" style={{ backgroundColor: colorSecondary }}>
        <div className="max-w-[1400px] mx-auto px-4">
          <ul className="flex items-center gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {menuCategories.map(cat => (
              <li key={cat.slug} className="flex-shrink-0 group relative">
                <Link
                  href={`/productos?cat=${cat.slug}`}
                  className="block px-3 py-3 text-[12px] text-white/90 hover:text-white hover:bg-[#254a7b] transition-colors whitespace-nowrap"
                >
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.name}
                </Link>
                {cat.children.length > 0 && (
                  <div className="hidden group-hover:block absolute top-full left-0 bg-[#315b91] rounded-b-lg shadow-xl py-1 z-50 min-w-[180px]">
                    {cat.children.map(sub => (
                      <Link key={sub.id} href={`/productos?cat=${sub.slug}`}
                        className="block px-4 py-2 text-[11px] text-white/80 hover:text-white hover:bg-[#254a7b] transition-colors whitespace-nowrap">
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
            {customMenuItems.map(item => (
              <li key={item.id} className="flex-shrink-0">
                <Link
                  href={item.href}
                  target={item.openNew ? '_blank' : undefined}
                  className="block px-3 py-2 text-[12px] text-gray-300 hover:text-white hover:bg-[#3a3a3a] transition-colors whitespace-nowrap"
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-[#2a2a2a] max-h-[85vh] overflow-y-auto">
          {/* Búsqueda mobile */}
          <div className="p-3 border-b border-[#2a2a2a]">
            <SearchBar />
          </div>
          {/* Usuario mobile */}
          <div className="p-3 border-b border-[#2a2a2a] flex items-center gap-2 text-sm text-gray-300">
            <UserIcon className="h-4 w-4" />
            {session ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-medium">{session.user.name}</span>
                <Link href="/mi-cuenta" className="text-gray-400 hover:text-white text-xs" onClick={() => setMobileMenu(false)}>Mi cuenta</Link>
                {session.user.role === 'admin' && (
                  <Link href="/admin" className="text-[#e8850c] text-xs" onClick={() => setMobileMenu(false)}>Admin</Link>
                )}
                <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 text-xs">Salir</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="hover:text-white" onClick={() => setMobileMenu(false)}>Ingresar</Link>
                <span className="text-gray-600">|</span>
                <Link href="/auth/register" className="hover:text-white" onClick={() => setMobileMenu(false)}>Registrarme</Link>
              </div>
            )}
          </div>
          {/* Carrito mobile */}
          <Link href="/carrito" className="flex items-center gap-3 p-3 border-b border-[#2a2a2a] text-white"
            onClick={() => setMobileMenu(false)}>
            <ShoppingCartIcon className="h-5 w-5" />
            <span className="text-sm flex-1">Mi compra</span>
            <span className="bg-[#00d4aa] text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
            <span className="font-bold text-sm">{mounted ? formatCurrency(cartTotal) : '—'}</span>
          </Link>
          {/* Categorías mobile */}
          <ul className="py-2">
            {hamburgerCategories.map(cat => (
              <li key={cat.slug}>
                <Link href={`/productos?cat=${cat.slug}`}
                  className="block px-4 py-2.5 text-gray-300 hover:text-white hover:bg-[#2a2a2a] text-sm transition-colors"
                  onClick={() => setMobileMenu(false)}>
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.name}
                </Link>
                {cat.children.length > 0 && cat.children.map(sub => (
                  <Link key={sub.id} href={`/productos?cat=${sub.slug}`}
                    className="block pl-8 pr-4 py-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] text-xs transition-colors"
                    onClick={() => setMobileMenu(false)}>
                    ↳ {sub.name}
                  </Link>
                ))}
              </li>
            ))}
            {customMenuItems.map(item => (
              <li key={item.id}>
                <Link href={item.href} target={item.openNew ? '_blank' : undefined}
                  className="block px-4 py-2.5 text-gray-300 hover:text-white hover:bg-[#2a2a2a] text-sm transition-colors"
                  onClick={() => setMobileMenu(false)}>
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
