import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

// GET /api/admin/orders/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: { include: { product: true } },
      payments: true,
      returns: true,
    },
  });

  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  return NextResponse.json(order);
}

// PUT /api/admin/orders/[id] - Actualizar estado
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus;
    if (body.trackingNumber !== undefined) updateData.trackingNumber = body.trackingNumber;
    if (body.trackingUrl !== undefined) updateData.trackingUrl = body.trackingUrl;
    if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes;

    const order = await prisma.order.update({ where: { id }, data: updateData });

    // Si se cancela, restaurar stock
    if (body.status === 'cancelled') {
      const items = await prisma.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        if (item.productId) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'in',
              quantity: item.quantity,
              reason: 'devolucion',
              reference: `Pedido ${order.orderNumber} cancelado`,
            },
          });
        }
      }
    }

    return NextResponse.json(order);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
