import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AIChat from '@/components/admin/AIChat';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'store_admin')) {
    redirect('/auth/login');
  }

  const isSuperAdmin = session.user.role === 'admin';

  const navSections = [
    {
      title: 'General',
      items: [
        { name: 'Dashboard', href: '/admin', icon: '📊' },
      ],
    },
    {
      title: 'Catálogo',
      items: [
        { name: 'Productos', href: '/admin/productos', icon: '📦' },
        { name: 'Precios / Márgenes', href: '/admin/precios', icon: '💲' },
        { name: 'Categorías', href: '/admin/categorias', icon: '📁' },
        { name: 'Marcas', href: '/admin/marcas', icon: '🏷️' },
        { name: 'Tipos', href: '/admin/tipos', icon: '🔖' },
      ],
    },
    {
      title: 'Ventas',
      items: [
        { name: 'Pedidos', href: '/admin/pedidos', icon: '🛒' },
        { name: 'Clientes', href: '/admin/clientes', icon: '👤' },
        { name: 'Cupones', href: '/admin/cupones', icon: '🎟️' },
        { name: 'Informes', href: '/admin/informes', icon: '📊' },
        { name: 'Pagos', href: '/admin/pagos', icon: '💳' },
        { name: 'Devoluciones', href: '/admin/devoluciones', icon: '↩️' },
      ],
    },
    {
      title: 'Integraciones',
      items: [
        { name: 'Sync Proveedor', href: '/admin/provider-sync', icon: '🔄' },
        { name: 'Sistema de stock', href: '/admin/stockba', icon: '🏭' },
        { name: 'APIs Externas', href: '/admin/api-sync', icon: '🔗' },
        { name: 'MercadoPago', href: '/admin/mercadopago', icon: '💰' },
      ],
    },
    {
      title: 'Contenido',
      items: [
        { name: 'Páginas', href: '/admin/paginas', icon: '📄' },
      ],
    },
    {
      title: 'Personalizar',
      items: [
        { name: 'Menú y Navegación', href: '/admin/menu', icon: '🧭' },
        { name: 'Apariencia', href: '/admin/apariencia', icon: '🎨' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { name: 'Usuarios', href: '/admin/usuarios', icon: '👥' },
        { name: 'Configuración', href: '/admin/configuracion', icon: '⚙️' },
        ...(isSuperAdmin ? [{ name: 'Super Admin', href: '/admin/super-admin', icon: '🛡️' }] : []),
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <Link href="/admin" className="block">
            <h2 className="text-lg font-black tracking-tight">
              <span className="text-[#e8850c]">Ferretería</span> Lavalleja
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Panel de Administración</p>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="px-5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{section.title}</p>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-2 text-[13px] text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-2">{session.user?.name}</div>
          <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors">← Volver a la tienda</Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
      <AIChat />
    </div>
  );
}
