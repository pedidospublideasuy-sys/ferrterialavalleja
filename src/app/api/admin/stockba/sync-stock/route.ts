import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  return role === 'admin' || role === 'ADMIN' || role === 'store_admin';
}
import prisma from '@/lib/prisma';
import { getStockBAProductStock } from '@/lib/stockba';

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const results = { updated: 0, skipped: 0, errors: [] as string[] };
  try {
    const products = await prisma.product.findMany({
      where: { sourceApi: 'stockba', sourceId: { not: null } },
      select: { id: true, sourceId: true, name: true },
    });
    for (const p of products) {
      if (!p.sourceId) continue;
      try {
        const res = await getStockBAProductStock(Number(p.sourceId));
        let qty = 0;
        if (Array.isArray(res.data)) qty = res.data.reduce((s: number, l: any) => s + (l.quantity ?? 0), 0);
        else if (typeof res.quantity === 'number') qty = res.quantity;
        await prisma.product.update({ where: { id: p.id }, data: { stock: qty } });
        results.updated++;
      } catch (err: any) {
        results.errors.push('[' + p.sourceId + '] ' + p.name + ': ' + err.message);
        results.skipped++;
      }
    }
    return NextResponse.json({ ok: true, ...results, total: products.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
