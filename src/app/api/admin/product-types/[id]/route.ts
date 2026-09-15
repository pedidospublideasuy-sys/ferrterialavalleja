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
  const body = await req.json();
  try {
    const type = await prisma.productType.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim(), slug: slugify(body.name, { lower: true, strict: true }) } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    });
    return NextResponse.json(type);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo actualizar' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.productType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'No se puede eliminar un tipo que tiene productos' }, { status: 400 });
  }
}
