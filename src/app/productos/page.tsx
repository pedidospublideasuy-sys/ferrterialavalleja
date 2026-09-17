import { prisma } from '@/lib/prisma';
import ProductsClient from './ProductsClient';

const PAGE_SIZE = 48;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; brand?: string; search?: string; sort?: string; minPrice?: string; maxPrice?: string; page?: string }>;
}) {
  const params = await searchParams;
  const where: any = { active: true };

  if (params.cat) {
    where.category = { slug: params.cat };
  }
  if (params.brand) {
    where.brand = { slug: params.brand };
  }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.minPrice || params.maxPrice) {
    where.price = {};
    if (params.minPrice) where.price.gte = parseFloat(params.minPrice);
    if (params.maxPrice) where.price.lte = parseFloat(params.maxPrice);
  }

  const orderBy: any =
    params.sort === 'price_asc' ? { price: 'asc' }
      : params.sort === 'price_desc' ? { price: 'desc' }
        : params.sort === 'name' ? { name: 'asc' }
          : { createdAt: 'desc' };

  const page = Math.max(1, parseInt(params.page || '1'));
  const skip = (page - 1) * PAGE_SIZE;

  // When searching without explicit sort, prioritize name matches
  let products: any[];
  let total: number;

  if (params.search && !params.sort) {
    // First: products matching by name
    const nameWhere = { ...where, OR: undefined, name: { contains: params.search, mode: 'insensitive' as const } };
    // Copy non-OR filters
    if (where.category) nameWhere.category = where.category;
    if (where.brand) nameWhere.brand = where.brand;
    if (where.price) nameWhere.price = where.price;

    const selectFields = {
      id: true, name: true, slug: true, price: true, comparePrice: true,
      images: true, sku: true, stock: true, isNew: true, featured: true,
      description: true,
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true, slug: true } },
    };

    const nameProducts = await prisma.product.findMany({
      where: { active: true, name: { contains: params.search, mode: 'insensitive' }, ...(params.cat ? { category: { slug: params.cat } } : {}), ...(params.brand ? { brand: { slug: params.brand } } : {}) },
      orderBy: { name: 'asc' },
      select: selectFields,
    });

    const nameIds = new Set(nameProducts.map((p: any) => p.id));

    const otherProducts = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      select: selectFields,
    });

    // Combine: name matches first, then the rest (deduplicated)
    const combined = [...nameProducts, ...otherProducts.filter((p: any) => !nameIds.has(p.id))];
    total = combined.length;
    products = combined.slice(skip, skip + PAGE_SIZE);
  } else {
    const [p, t] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: PAGE_SIZE,
        select: {
          id: true, name: true, slug: true, price: true, comparePrice: true,
          images: true, sku: true, stock: true, isNew: true, featured: true,
          description: true,
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);
    products = p;
    total = t;
  }

  const [categories, brands, priceRange] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
    prisma.product.aggregate({ where: { active: true }, _min: { price: true }, _max: { price: true } }),
  ]);

  return (
    <ProductsClient
      products={products as any}
      categories={categories}
      brands={brands}
      currentCat={params.cat || ''}
      currentBrand={params.brand || ''}
      currentSearch={params.search || ''}
      currentSort={params.sort || ''}
      currentMinPrice={params.minPrice || ''}
      currentMaxPrice={params.maxPrice || ''}
      page={page}
      totalPages={Math.ceil(total / PAGE_SIZE)}
      total={total}
      priceMin={Math.floor(priceRange._min.price || 0)}
      priceMax={Math.ceil(priceRange._max.price || 999999)}
    />
  );
}
