import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) {
      updateData.name = body.name;
      const baseSlug = slugify(body.name, { lower: true, strict: true }) || 'marca';
      let slug = baseSlug;
      let suffix = 2;
      while (true) {
        const conflict = await prisma.brand.findUnique({ where: { slug } });
        if (!conflict || conflict.id === id) break;
        slug = `${baseSlug}-${suffix++}`;
      }
      updateData.slug = slug;
    }
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.active !== undefined) updateData.active = body.active;

    const brand = await prisma.brand.update({ where: { id }, data: updateData });
    return NextResponse.json(brand);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ message: 'Marca eliminada' });
  } catch {
    return NextResponse.json({ error: 'No se puede eliminar (tiene productos asociados)' }, { status: 400 });
  }
}
