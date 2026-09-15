'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FooterSettings {
  logo_text: string; logo_accent: string; logo_color: string; logo_image_url: string;
  footer_desc: string; footer_phone1: string; footer_phone2: string;
  footer_email: string; footer_hours: string; footer_address: string;
  footer_service: string; footer_bank_info: string; footer_copyright: string;
  footer_price_disclaimer: string; footer_logo_width: string; footer_logo_height: string;
  footer_nosotros_title: string; footer_tienda_title: string; footer_ayuda_title: string; footer_show_bank_info: string;
  footer_bg: string;
}

interface NavItem { id: string; label: string; href: string; icon: string | null; openNew: boolean }

const DEFAULTS: FooterSettings = {
  logo_text: 'Ferretería Lavalleja', logo_accent: 'Ferretería', logo_color: '#ffffff', logo_image_url: '',
  footer_desc: 'La tienda de insumos de tecnología con mayor servicio y variedad.',
  footer_phone1: '2929 0990', footer_phone2: '2924 9009',
  footer_email: '',
  footer_hours: 'Lun. a Vie. de 9.30 a 12.30 y de 13.30 a 18.30 hs.',
  footer_address: 'Bacigalupi 2084 esq. Lima', footer_service: 'Lima 1668',
  footer_bank_info: 'BROU C. Corriente dólares Nº 1559417-00001 | SANTANDER C. Corriente dólares Nº 005100207330 | SCOTIABANK C. Corriente dólares Nº 2513484200 | ITAÚ C. Corriente dólares Nº 3304980 | HSBC C. Corriente dólares Nº 3298943-2 | PREX Card Nº cuenta dólares 90033713',
  footer_copyright: 'Ferretería Lavalleja',
  footer_price_disclaimer: 'Los precios son en dólares americanos y no incluyen IVA.',
  footer_logo_width: '180', footer_logo_height: '56',
  footer_nosotros_title: 'Nosotros', footer_tienda_title: 'Tienda', footer_ayuda_title: 'Ayuda', footer_show_bank_info: 'true',
  footer_bg: '#222222',
};

// Fallbacks hardcoded por si la DB está vacía
const FALLBACK_NOSOTROS: NavItem[] = [
  { id: '1', label: 'Compañía', href: '/empresa', icon: null, openNew: false },
  { id: '2', label: 'Instalaciones', href: '/instalaciones', icon: null, openNew: false },
  { id: '3', label: 'Noticias', href: '/noticias', icon: null, openNew: false },
  { id: '4', label: 'Servicios', href: '/servicios', icon: null, openNew: false },
  { id: '5', label: 'Trabaja con nosotros', href: '/trabaja-con-nosotros', icon: null, openNew: false },
  { id: '6', label: 'Ubicación', href: '/ubicacion', icon: null, openNew: false },
  { id: '7', label: 'Contacto', href: '/contacto', icon: null, openNew: false },
];
const FALLBACK_TIENDA: NavItem[] = [
  { id: '1', label: 'Recién arribados', href: '/productos?new=true', icon: null, openNew: false },
  { id: '2', label: 'Arribando (Reservas)', href: '/productos?category=arribando', icon: null, openNew: false },
  { id: '3', label: 'Categorías', href: '/productos', icon: null, openNew: false },
  { id: '4', label: 'Combos', href: '/productos?category=combos', icon: null, openNew: false },
  { id: '5', label: 'Marcas', href: '/marcas', icon: null, openNew: false },
];
const FALLBACK_AYUDA: NavItem[] = [
  { id: '1', label: '🏷️ OUTLET', href: '/productos?category=outlet', icon: null, openNew: false },
  { id: '2', label: 'Políticas de garantía', href: '/garantia', icon: null, openNew: false },
  { id: '3', label: 'Políticas de ventas', href: '/politicas-de-ventas', icon: null, openNew: false },
];

async function fetchMenu(location: string): Promise<NavItem[]> {
  const res = await fetch(`/api/public/menu?location=${location}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function Footer() {
  const [s, setS] = useState<FooterSettings>(DEFAULTS);
  const [nosotros, setNosotros] = useState<NavItem[]>(FALLBACK_NOSOTROS);
  const [tienda, setTienda] = useState<NavItem[]>(FALLBACK_TIENDA);
  const [ayuda, setAyuda] = useState<NavItem[]>(FALLBACK_AYUDA);

  useEffect(() => {
    fetch('/api/public/settings?keys=logo_image_url,logo_text,logo_accent,logo_color,footer_bg,footer_logo_width,footer_logo_height,footer_nosotros_title,footer_tienda_title,footer_ayuda_title,footer_show_bank_info,footer_desc,footer_phone1,footer_phone2,footer_email,footer_hours,footer_address,footer_service,footer_bank_info,footer_copyright,footer_price_disclaimer', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const merged = { ...DEFAULTS };
          for (const [k, v] of Object.entries(data as Record<string, string>)) {
            if (v) (merged as any)[k] = v;
          }
          setS(merged);
        }
      })
      .catch(() => { });

    // Cargar menús del footer desde la DB
    fetchMenu('footer_nosotros').then(items => { if (items.length > 0) setNosotros(items); });
    fetchMenu('footer_tienda').then(items => { if (items.length > 0) setTienda(items); });
    fetchMenu('footer_ayuda').then(items => { if (items.length > 0) setAyuda(items); });
  }, []);

  const logoRest = s.logo_text.slice(s.logo_accent.length);
  const banks = s.footer_bank_info.split('|').map((b: string) => b.trim()).filter(Boolean);

  return (
    <footer className="mt-auto" style={{ backgroundColor: s.footer_bg }}>
      <div className="bg-[#2a2a2a] border-b border-[#333]">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              {s.logo_image_url ? (
                <img src={s.logo_image_url} alt={s.logo_text} className="object-contain object-left mb-2" style={{ width: `${s.footer_logo_width}px`, height: `${s.footer_logo_height}px` }} />
              ) : (
                <div className="text-xl font-black tracking-tight leading-none mb-2">
                  <span style={{ color: s.logo_color }}>{s.logo_accent}</span>
                  <span className="text-white text-lg font-bold">{logoRest}</span>
                </div>
              )}
              <p className="text-[13px] text-gray-400 leading-relaxed">{s.footer_desc}</p>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-gray-300 mb-3 uppercase tracking-wider">Contacto</h4>
              <ul className="space-y-2 text-[13px] text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#e8850c] mt-0.5">📞</span>
                  <div>
                    {s.footer_phone1 && <a href={`tel:+598${s.footer_phone1.replace(/\D/g, '')}`} className="hover:text-white transition-colors block">{s.footer_phone1}</a>}
                    {s.footer_phone2 && <a href={`tel:+598${s.footer_phone2.replace(/\D/g, '')}`} className="hover:text-white transition-colors block">{s.footer_phone2}</a>}
                  </div>
                </li>
                {s.footer_email && <li className="flex items-center gap-2"><span className="text-[#e8850c]">📧</span><a href={`mailto:${s.footer_email}`} className="hover:text-white transition-colors">{s.footer_email}</a></li>}
                {s.footer_hours && <li className="flex items-start gap-2"><span className="text-[#e8850c] mt-0.5">🕐</span><span>{s.footer_hours}</span></li>}
                {(s.footer_address || s.footer_service) && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#e8850c] mt-0.5">📍</span>
                    <div>
                      {s.footer_address && <span className="block"><b className="text-gray-300">Ventas</b> {s.footer_address}</span>}
                    </div>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-gray-300 mb-3 uppercase tracking-wider">{s.footer_nosotros_title}</h4>
              <ul className="space-y-1.5 text-[13px] text-gray-400">
                {nosotros.map(item => (
                  <li key={item.id}>
                    <Link href={item.href} target={item.openNew ? '_blank' : undefined} className="hover:text-white transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-gray-300 mb-3 uppercase tracking-wider">{s.footer_tienda_title}</h4>
              <ul className="space-y-1.5 text-[13px] text-gray-400 mb-4">
                {tienda.map(item => (
                  <li key={item.id}>
                    <Link href={item.href} target={item.openNew ? '_blank' : undefined} className="hover:text-white transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
              <h4 className="text-[13px] font-semibold text-gray-300 mb-2 uppercase tracking-wider">{s.footer_ayuda_title}</h4>
              <ul className="space-y-1.5 text-[13px] text-gray-400">
                {ayuda.filter(item => !item.label.toLowerCase().includes('outlet')).map(item => (
                  <li key={item.id}>
                    <Link href={item.href} target={item.openNew ? '_blank' : undefined} className="hover:text-white transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-4">
        <p className="text-[11px] text-gray-500 text-center mb-3">{s.footer_price_disclaimer}</p>
        {false && s.footer_show_bank_info === 'true' && banks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[11px] text-gray-600 mb-3">
            {banks.map((bank: string, i: number) => {
              const sp = bank.indexOf(' ');
              const name = sp > -1 ? bank.slice(0, sp) : bank;
              const rest = sp > -1 ? bank.slice(sp) : '';
              return <span key={i}><b className="text-gray-500">{name}</b>{rest}</span>;
            })}
          </div>
        )}
        <div className="text-center text-[11px] text-gray-600">
          © Copyright {new Date().getFullYear()}{' '}
          <span style={{ color: s.logo_color }}>{s.footer_copyright || s.logo_text}</span>
        </div>
      </div>
    </footer>
  );
}
