import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

// GET /api/admin/products/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, brand: true, type: true, stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });

  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  return NextResponse.json(product);
}

// PUT /api/admin/products/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
      updateData.slug = slugify(body.name, { lower: true, strict: true });
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.shortDesc !== undefined) updateData.shortDesc = body.shortDesc;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.barcode !== undefined) updateData.barcode = body.barcode;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.comparePrice !== undefined) updateData.comparePrice = body.comparePrice ? parseFloat(body.comparePrice) : null;
    if (body.cost !== undefined) updateData.cost = body.cost ? parseFloat(body.cost) : null;
    if (body.stock !== undefined) {
      const oldProduct = await prisma.product.findUnique({ where: { id }, select: { stock: true } });
      const newStock = parseInt(body.stock);
      const diff = newStock - (oldProduct?.stock || 0);
      if (diff !== 0) {
        await prisma.stockMovement.create({
          data: {
            productId: id,
            type: diff > 0 ? 'in' : 'out',
            quantity: Math.abs(diff),
            reason: 'ajuste',
            reference: 'Edición manual de stock',
          },
        });
      }
      updateData.stock = newStock;
    }
    if (body.minStock !== undefined) updateData.minStock = parseInt(body.minStock);
    if (body.images !== undefined) updateData.images = body.images;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.isNew !== undefined) updateData.isNew = body.isNew;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.brandId !== undefined) updateData.brandId = body.brandId || null;
    if (body.typeId !== undefined) updateData.typeId = body.typeId || null;
    if (body.specs !== undefined) updateData.specs = body.specs;
    if (body.weight !== undefined) updateData.weight = body.weight ? parseFloat(body.weight) : null;
    if (body.dimensions !== undefined) updateData.dimensions = body.dimensions;
    if (body.warranty !== undefined) updateData.warranty = body.warranty;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.currency !== undefined) updateData.currency = body.currency;

    const product = await prisma.product.update({ where: { id }, data: updateData });
    return NextResponse.json(product);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: 'Producto eliminado' });
  } catch {
    return NextResponse.json({ error: 'No se puede eliminar el producto (tiene pedidos asociados)' }, { status: 400 });
  }
}
