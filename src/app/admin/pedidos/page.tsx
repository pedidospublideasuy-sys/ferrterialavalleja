import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = 25;
  const status = params.status || '';
  const search = params.search || '';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) where.OR = [
    { orderNumber: { contains: search } },
    { user: { name: { contains: search } } },
    { user: { email: { contains: search } } },
  ];

  const [orders, total, stats] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: true, items: true, payments: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
    Promise.all([
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'confirmed' } }),
      prisma.order.count({ where: { status: 'processing' } }),
      prisma.order.count({ where: { status: 'shipped' } }),
      prisma.order.count({ where: { status: 'delivered' } }),
      prisma.order.count({ where: { status: 'cancelled' } }),
    ]),
  ]);

  const pages = Math.ceil(total / limit);
  const [pending, confirmed, processing, shipped, delivered, cancelled] = stats;

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
    processing: { label: 'Procesando', color: 'bg-indigo-100 text-indigo-800' },
    shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800' },
  };

  const paymentColors: Record<string, string> = {
    pending: 'text-yellow-600',
    paid: 'text-green-600',
    failed: 'text-red-600',
    refunded: 'text-gray-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">{total} pedidos</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/informes" className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            📊 Informes
          </Link>
          <Link href="/admin/pedidos/crear" className="bg-[#e8850c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors">
            + Crear Pedido
          </Link>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Pendientes', value: pending, color: 'border-yellow-500', filter: 'pending' },
          { label: 'Confirmados', value: confirmed, color: 'border-blue-500', filter: 'confirmed' },
          { label: 'Procesando', value: processing, color: 'border-indigo-500', filter: 'processing' },
          { label: 'Enviados', value: shipped, color: 'border-purple-500', filter: 'shipped' },
          { label: 'Entregados', value: delivered, color: 'border-green-500', filter: 'delivered' },
          { label: 'Cancelados', value: cancelled, color: 'border-red-500', filter: 'cancelled' },
        ].map(s => (
          <Link key={s.filter} href={`/admin/pedidos?status=${s.filter}`}
            className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${s.color} hover:shadow-md transition-shadow ${status === s.filter ? 'ring-2 ring-[#e8850c]/30' : ''}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold">{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <form className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Buscar</label>
            <input type="text" name="search" defaultValue={search} placeholder="Nro pedido, cliente, email..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" />
          </div>
          <div className="w-44">
            <label className="block text-xs text-gray-500 mb-1">Estado</label>
            <select name="status" defaultValue={status}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30">
              <option value="">Todos</option>
              {Object.entries(statusConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">Filtrar</button>
          <Link href="/admin/pedidos" className="text-sm text-gray-500 hover:text-gray-700 py-2">Limpiar</Link>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 text-xs uppercase tracking-wider">
              <th className="p-4"># Pedido</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Items</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-center">Pago</th>
              <th className="p-4">Método</th>
              <th className="p-4">Fecha</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <Link href={`/admin/pedidos/${o.id}`} className="font-medium text-blue-600 hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="p-4">
                  <div className="font-medium text-gray-900">{o.user.name}</div>
                  <div className="text-xs text-gray-400">{o.user.email}</div>
                </td>
                <td className="p-4 text-gray-500">{o.items.length} productos</td>
                <td className="p-4 text-right font-bold">
                  {o.totalUYU > 0 && <div className="text-gray-900">UYU {o.totalUYU.toFixed(2)}</div>}
                  {o.totalUSD > 0 && <div className="text-green-700">USD {o.totalUSD.toFixed(2)}</div>}
                  {o.totalUYU === 0 && o.totalUSD === 0 && <div>UYU {o.total.toFixed(2)}</div>}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[o.status]?.color || 'bg-gray-100'}`}>
                    {statusConfig[o.status]?.label || o.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`text-xs font-medium ${paymentColors[o.paymentStatus] || 'text-gray-500'}`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-xs">{o.paymentMethod || '-'}</td>
                <td className="p-4 text-gray-500">{new Date(o.createdAt).toLocaleDateString('es-UY')}</td>
                <td className="p-4 text-center">
                  <Link href={`/admin/pedidos/${o.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-gray-400">No se encontraron pedidos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total}
          </p>
          <div className="flex gap-1">
            {page > 1 && (
              <Link href={`/admin/pedidos?page=${page - 1}&status=${status}&search=${search}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">← Anterior</Link>
            )}
            {page < pages && (
              <Link href={`/admin/pedidos?page=${page + 1}&status=${status}&search=${search}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Siguiente →</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
