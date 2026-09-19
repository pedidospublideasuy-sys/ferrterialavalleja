import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

// POST /api/admin/orders - Create order from admin
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, items, shippingAddr, shippingCity, shippingPhone, notes, paymentMethod } = body;

    if (!userId || !items?.length) {
      return NextResponse.json({ error: 'Cliente y productos son requeridos' }, { status: 400 });
    }

    // Validate products exist and have stock
    let subtotalUYU = 0;
    let subtotalUSD = 0;
    const orderItems: { productId: string; name: string; sku: string; price: number; quantity: number; subtotal: number; currency: string }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return NextResponse.json({ error: `Producto ${item.productId} no encontrado` }, { status: 400 });

      const qty = parseInt(item.quantity) || 1;
      const price = product.price;
      const currency = product.currency || 'UYU';
      const itemSubtotal = price * qty;

      if (currency === 'USD') {
        subtotalUSD += itemSubtotal;
      } else {
        subtotalUYU += itemSubtotal;
      }

      orderItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku || '',
        price,
        currency,
        quantity: qty,
        subtotal: itemSubtotal,
      });
    }

    // Generate order number
    const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
    const lastNum = lastOrder?.orderNumber ? parseInt(lastOrder.orderNumber.replace('ORD-', '')) : 0;
    const orderNumber = `ORD-${String(lastNum + 1).padStart(6, '0')}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        subtotal: subtotalUYU + subtotalUSD,
        tax: 0,
        shipping: 0,
        total: subtotalUYU + subtotalUSD,
        totalUYU: subtotalUYU,
        totalUSD: subtotalUSD,
        status: 'confirmed',
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
        paymentMethod: paymentMethod || 'admin',
        shippingAddr: shippingAddr || '',
        shippingCity: shippingCity || '',
        shippingPhone: shippingPhone || '',
        internalNotes: notes || 'Pedido creado desde panel admin',
        items: {
          create: orderItems,
        },
      },
      include: { user: true, items: true },
    });

    // Decrease stock
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'out',
          quantity: item.quantity,
          reason: 'venta',
          reference: `Pedido ${orderNumber} (admin)`,
        },
      });
    }

    return NextResponse.json({ order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear pedido';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
