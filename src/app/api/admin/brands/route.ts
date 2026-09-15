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

  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(brands);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const baseSlug = slugify(body.name, { lower: true, strict: true }) || 'marca';
    let slug = baseSlug;
    let suffix = 2;
    while (await prisma.brand.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const brand = await prisma.brand.create({
      data: {
        name: body.name,
        slug,
        logo: body.logo || null,
        website: body.website || null,
        active: body.active !== false,
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear marca';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
