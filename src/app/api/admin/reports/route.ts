import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

// GET /api/admin/reports?type=orders|sales|stock|shipping
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'orders';
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to + 'T23:59:59');
  const createdAtFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  try {
    if (type === 'orders') {
      const orders = await prisma.order.findMany({
        where: createdAtFilter,
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const summary = {
        total: orders.length,
        totalAmount: orders.reduce((acc, o) => acc + o.total, 0),
        byStatus: {} as Record<string, number>,
        byPayment: {} as Record<string, number>,
      };
      for (const o of orders) {
        summary.byStatus[o.status] = (summary.byStatus[o.status] || 0) + 1;
        summary.byPayment[o.paymentStatus] = (summary.byPayment[o.paymentStatus] || 0) + 1;
      }

      return NextResponse.json({
        type: 'orders',
        summary,
        data: orders.map(o => ({
          orderNumber: o.orderNumber,
          client: o.user.name,
          email: o.user.email,
          items: o.items.length,
          subtotal: o.subtotal,
          tax: o.tax,
          shipping: o.shipping,
          total: o.total,
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          date: o.createdAt,
        })),
      });
    }

    if (type === 'sales') {
      const orders = await prisma.order.findMany({
        where: { ...createdAtFilter, paymentStatus: 'paid' },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });

      const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
      for (const o of orders) {
        for (const item of o.items) {
          const key = item.productId || ('deleted-' + item.name);
          if (!productSales[key]) {
            productSales[key] = { name: item.name, qty: 0, revenue: 0 };
          }
          productSales[key].qty += item.quantity;
          productSales[key].revenue += item.subtotal;
        }
      }

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 50);

      const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
      const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;

      return NextResponse.json({
        type: 'sales',
        summary: {
          totalOrders: orders.length,
          totalRevenue,
          avgOrderValue,
          totalItems: orders.reduce((acc, o) => acc + o.items.reduce((a, i) => a + i.quantity, 0), 0),
        },
        topProducts,
        data: orders.map(o => ({
          orderNumber: o.orderNumber,
          total: o.total,
          items: o.items.length,
          date: o.createdAt,
        })),
      });
    }

    if (type === 'stock') {
      const products = await prisma.product.findMany({
        where: { active: true },
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
        orderBy: { stock: 'asc' },
      });

      const lowStock = products.filter(p => p.stock <= 5);
      const outOfStock = products.filter(p => p.stock === 0);
      const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);

      return NextResponse.json({
        type: 'stock',
        summary: {
          totalProducts: products.length,
          lowStock: lowStock.length,
          outOfStock: outOfStock.length,
          totalStockValue: totalValue,
        },
        data: products.map(p => ({
          sku: p.sku || '-',
          name: p.name,
          category: p.category?.name || '-',
          brand: p.brand?.name || '-',
          stock: p.stock,
          price: p.price,
          cost: p.cost,
          stockValue: p.price * p.stock,
        })),
      });
    }

    if (type === 'shipping') {
      const orders = await prisma.order.findMany({
        where: {
          ...createdAtFilter,
          status: { in: ['shipped', 'delivered', 'processing'] },
        },
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const byStatus: Record<string, number> = {};
      for (const o of orders) {
        byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      }

      return NextResponse.json({
        type: 'shipping',
        summary: {
          total: orders.length,
          byStatus,
        },
        data: orders.map(o => ({
          orderNumber: o.orderNumber,
          client: o.user.name,
          status: o.status,
          trackingNumber: o.trackingNumber || '-',
          address: [o.shippingAddr, o.shippingCity].filter(Boolean).join(', '),
          items: o.items.reduce((a, i) => a + i.quantity, 0),
          date: o.createdAt,
        })),
      });
    }

    return NextResponse.json({ error: 'Tipo de informe no válido' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al generar informe';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
