import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items, name, address, city, phone, notes, paymentMethod } = body;

    let subtotalUYU = 0;
    let subtotalUSD = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;
      const lineTotal = product.price * item.quantity;
      const currency = product.currency || 'UYU';
      
      if (currency === 'USD') {
        subtotalUSD += lineTotal;
      } else {
        subtotalUYU += lineTotal;
      }

      orderItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        currency: currency,
        quantity: item.quantity,
        subtotal: lineTotal,
      });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session.user.id as string,
        subtotal: subtotalUYU + subtotalUSD, // Legacy aggregate
        total: subtotalUYU + subtotalUSD, // Legacy aggregate
        totalUYU: subtotalUYU,
        totalUSD: subtotalUSD,
        shippingAddr: (address || '') + ', ' + (city || ''),
        notes,
        paymentMethod,
        items: { create: orderItems },
      },
    });

    return NextResponse.json({ success: true, orderNumber: order.orderNumber });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
  }
}
