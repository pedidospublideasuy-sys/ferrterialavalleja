import prisma from '@/lib/prisma';
import Link from 'next/link';
import DashboardCharts from '@/components/admin/DashboardCharts';

export default async function AdminDashboard() {
  const [productCount, orderCount, userCount, totalSales, lowStock, pendingOrders, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid' } }),
    prisma.product.count({ where: { stock: { lte: 5 }, active: true } }),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true, items: true },
    }),
  ]);

  // Obtener datos de ventas por mes (últimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { total: true, status: true, createdAt: true, paymentStatus: true },
  });

  // Agrupar por mes
  const monthlyData: Record<string, { ventas: number; pedidos: number; devoluciones: number }> = {};
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = months[d.getMonth()] + ' ' + d.getFullYear();
    monthlyData[key] = { ventas: 0, pedidos: 0, devoluciones: 0 };
  }

  for (const order of orders) {
    const key = months[order.createdAt.getMonth()] + ' ' + order.createdAt.getFullYear();
    if (monthlyData[key]) {
      monthlyData[key].pedidos++;
      if (order.paymentStatus === 'paid') monthlyData[key].ventas += order.total;
      if (order.status === 'refunded') monthlyData[key].devoluciones++;
    }
  }

  const chartData = Object.entries(monthlyData).map(([mes, data]) => ({ mes, ...data }));

  // Top productos
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId', 'name'],
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen general de Ferretería Lavalleja</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/productos/nuevo" className="bg-[#e8850c] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#d47a0b] transition-colors">
            + Nuevo Producto
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#e8850c]">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Ventas Totales</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">USD {(totalSales._sum.total || 0).toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Pedidos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{orderCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Pendientes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Productos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{productCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-red-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Stock Bajo</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{lowStock}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Usuarios</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{userCount}</p>
        </div>
      </div>

      {/* Gráficas */}
      <DashboardCharts data={chartData} />

      {/* Grid de tablas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
        {/* Pedidos Recientes */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Pedidos Recientes</h2>
            <Link href="/admin/pedidos" className="text-sm text-[#e8850c] hover:underline">Ver todos →</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Pedido</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3">
                    <Link href={`/admin/pedidos/${order.id}`} className="font-medium text-blue-600 hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3">{order.user.name}</td>
                  <td className="py-3 font-medium">USD {order.total.toFixed(2)}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString('es-UY')}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">No hay pedidos aún</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top Productos + Stock Bajo */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-lg mb-4">Top Productos</h2>
            {topProducts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#e8850c] text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p._sum.quantity} vendidos · USD {(p._sum.subtotal || 0).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-lg mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/admin/productos/nuevo" className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-center text-sm transition-colors">
                <span className="block text-lg mb-1">📦</span>Nuevo Producto
              </Link>
              <Link href="/admin/pedidos" className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-center text-sm transition-colors">
                <span className="block text-lg mb-1">🛒</span>Ver Pedidos
              </Link>
              <Link href="/admin/api-sync" className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-center text-sm transition-colors">
                <span className="block text-lg mb-1">🔗</span>Sincronizar
              </Link>
              <Link href="/admin/configuracion" className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-center text-sm transition-colors">
                <span className="block text-lg mb-1">⚙️</span>Config
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
