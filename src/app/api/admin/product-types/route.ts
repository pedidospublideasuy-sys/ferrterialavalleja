import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json(await prisma.productType.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } }));
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  try {
    const type = await prisma.productType.create({
      data: { name: body.name.trim(), slug: slugify(body.name, { lower: true, strict: true }), active: body.active !== false },
    });
    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear el tipo' }, { status: 400 });
  }
}
