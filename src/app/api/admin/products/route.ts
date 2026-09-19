import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

// GET /api/admin/products - Lista todos los productos con filtros
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId');
  const brandId = searchParams.get('brandId');
  const active = searchParams.get('active');
  const featured = searchParams.get('featured');

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
  if (brandId) where.brandId = brandId;
  if (active !== null && active !== undefined && active !== '') where.active = active === 'true';
  if (featured === 'true') where.featured = true;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true, type: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/admin/products - Crear producto
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const slug = slugify(body.name, { lower: true, strict: true });

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        shortDesc: body.shortDesc || null,
        sku: body.sku,
        barcode: body.barcode || null,
        price: parseFloat(body.price),
        comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : null,
        cost: body.cost ? parseFloat(body.cost) : null,
        stock: parseInt(body.stock || '0'),
        minStock: parseInt(body.minStock || '0'),
        images: body.images || '[]',
        featured: body.featured || false,
        active: body.active !== false,
        isNew: body.isNew || false,
        currency: body.currency || 'UYU',
        categoryId: body.categoryId,
        brandId: body.brandId || null,
        typeId: body.typeId || null,
        specs: body.specs || null,
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions || null,
        warranty: body.warranty || null,
        tags: body.tags || null,
        variants: body.variants && body.variants.length > 0 ? {
          create: body.variants.map((v: any) => ({
            name: v.name,
            sku: v.sku || null,
            price: v.price,
            comparePrice: v.comparePrice || null,
            stock: v.stock || 0,
            attributes: v.attributes || '{}',
            active: v.active !== false
          }))
        } : undefined
      },
    });

    // Registrar movimiento de stock
    if (parseInt(body.stock || '0') > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'in',
          quantity: parseInt(body.stock),
          reason: 'importacion',
          reference: 'Creación de producto',
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear producto';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const body = await req.json();
    if (body.all === true) {
      const result = await prisma.product.deleteMany();
      return NextResponse.json({ deleted: result.count });
    }
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === 'string') : [];
    if (ids.length === 0) return NextResponse.json({ error: 'Seleccioná al menos un producto' }, { status: 400 });
    const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ deleted: result.count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudieron eliminar los productos';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
