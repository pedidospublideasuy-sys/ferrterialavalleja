import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    if (body.role !== undefined) updateData.role = body.role;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.email !== undefined) updateData.email = body.email;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    return NextResponse.json({ user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
