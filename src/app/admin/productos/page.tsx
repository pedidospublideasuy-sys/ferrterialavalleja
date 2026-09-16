import prisma from '@/lib/prisma';
import Link from 'next/link';
import ProductListTable from '@/components/admin/ProductListTable';

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; category?: string; brand?: string; active?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = 25;
  const search = params.search || '';
  const categoryId = params.category || '';
  const activeFilter = params.active;

  const where: Record<string, unknown> = {};
  if (search.trim()) {
    const terms = search.trim().split(/\s+/).filter(Boolean);
    where.AND = terms.map(term => ({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { tags: { contains: term, mode: 'insensitive' } },
      ],
    }));
  }
  if (categoryId) where.categoryId = categoryId;
  if (activeFilter !== undefined && activeFilter !== '') where.active = activeFilter === 'true';

  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: {
        parentId: null,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <p className="text-sm text-gray-500 mt-1">{total} productos encontrados</p>
        </div>
        <Link href="/admin/productos/nuevo"
          className="bg-[#e8850c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d47a0b] transition-colors">
          + Nuevo Producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <form className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Buscar</label>
            <input type="text" name="search" defaultValue={search} placeholder="Nombre, SKU o código..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30" />
          </div>
          <div className="w-48">
            <label className="block text-xs text-gray-500 mb-1">Categoría</label>
            <select name="category" defaultValue={categoryId}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30">
              <option value="">Todas</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-xs text-gray-500 mb-1">Marca</label>
            <select name="brand" defaultValue={params.brand || ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30">
              <option value="">Todas</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs text-gray-500 mb-1">Estado</label>
            <select name="active" defaultValue={activeFilter || ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8850c]/30">
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
            Filtrar
          </button>
          <Link href="/admin/productos" className="text-sm text-gray-500 hover:text-gray-700 py-2">Limpiar</Link>
        </form>
      </div>

      <ProductListTable products={products} />

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total}
          </p>
          <div className="flex gap-1">
            {page > 1 && (
              <Link href={`/admin/productos?page=${page - 1}&search=${search}&category=${categoryId}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">← Anterior</Link>
            )}
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              const p = i + Math.max(1, page - 2);
              if (p > pages) return null;
              return (
                <Link key={p} href={`/admin/productos?page=${p}&search=${search}&category=${categoryId}`}
                  className={`px-3 py-1.5 text-sm border rounded-lg ${p === page ? 'bg-[#e8850c] text-white border-[#e8850c]' : 'hover:bg-gray-50'}`}>
                  {p}
                </Link>
              );
            })}
            {page < pages && (
              <Link href={`/admin/productos?page=${page + 1}&search=${search}&category=${categoryId}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Siguiente →</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
