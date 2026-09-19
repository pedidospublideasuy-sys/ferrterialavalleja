import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let config = await prisma.paymentConfig.findUnique({ where: { provider: 'mercadopago' } });
  if (!config) {
    config = await prisma.paymentConfig.create({
      data: { provider: 'mercadopago', sandbox: true, active: false },
    });
  }

  // No enviar tokens completos al frontend
  return NextResponse.json({
    ...config,
    accessToken: config.accessToken ? '••••••••' + config.accessToken.slice(-4) : null,
    webhookSecret: config.webhookSecret ? '••••••••' : null,
  });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.publicKey !== undefined) updateData.publicKey = body.publicKey;
    if (body.accessToken !== undefined) updateData.accessToken = body.accessToken;
    if (body.webhookSecret !== undefined) updateData.webhookSecret = body.webhookSecret;
    if (body.sandbox !== undefined) updateData.sandbox = body.sandbox;
    if (body.active !== undefined) updateData.active = body.active;

    const config = await prisma.paymentConfig.upsert({
      where: { provider: 'mercadopago' },
      create: {
        provider: 'mercadopago',
        publicKey: body.publicKey || null,
        accessToken: body.accessToken || null,
        webhookSecret: body.webhookSecret || null,
        sandbox: body.sandbox ?? true,
        active: body.active ?? false,
      },
      update: updateData,
    });

    return NextResponse.json(config);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al guardar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
